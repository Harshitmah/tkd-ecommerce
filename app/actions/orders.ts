"use server"

import { createClient } from "@supabase/supabase-js"
import { upsertUserProfile } from "./profiles"
import { triggerWorkflowEvent } from "./workflows"

export async function createOrder({
  userId,
  shippingInfo,
  paymentMethod,
  couponCode,
  items,
  subtotal,
  discountAmount,
  finalTotal,
  razorpayId,
  isFailed = false,
}: {
  userId: string | null
  shippingInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
  paymentMethod: "online" | "cod"
  couponCode: string | null
  items: Array<{
    productId: string
    variantId?: string | null
    title: string
    image: string
    variantInfo?: any | null
    quantity: number
    price: number
  }>
  subtotal: number
  discountAmount: number
  finalTotal: number
  razorpayId?: string | null
  isFailed?: boolean
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in environment variables.")
    return { success: false, error: "Internal Server Error: Missing credentials" }
  }

  // Create high-privilege service client to bypass RLS policies during order insertion
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 1. Ensure user profile is registered in DB if a logged-in user is checking out
    let authEmail = shippingInfo.email
    if (userId) {
      // Get the actual auth email from profiles
      const { data: userProfile } = await supabase.from("profiles").select("email").eq("id", userId).single()
      if (userProfile && userProfile.email) {
        authEmail = userProfile.email
      }

      const fullName = `${shippingInfo.firstName} ${shippingInfo.lastName || ""}`.trim() || "Customer"
      const res = await upsertUserProfile(
        userId,
        authEmail,
        fullName
      )
      if (!res.success) {
        return { success: false, error: `Failed to register user profile: ${res.error}` }
      }
    }

    // 2. Format and insert the order
    const orderData = {
      user_id: userId || null,
      email: authEmail,
      shipping_address: shippingInfo,
      billing_address: shippingInfo,
      subtotal: subtotal,
      discount_amount: discountAmount,
      total: finalTotal,
      coupon_code: couponCode || null,
      payment_status: isFailed ? 'failed' : (paymentMethod === "cod" ? 'pending' : 'paid'),
      fulfillment_status: 'pending',
      razorpay_payment_id: razorpayId || null,
      notes: paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment",
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.error("Error inserting order:", orderError)
      return { success: false, error: orderError.message }
    }

    // 2b. If coupon was applied, increment coupon usage count
    if (couponCode) {
      const { data: couponData, error: couponFetchError } = await supabase
        .from("coupons")
        .select("times_used")
        .eq("code", couponCode.toUpperCase())
        .single()
      
      if (!couponFetchError && couponData) {
        await supabase
          .from("coupons")
          .update({ times_used: (couponData.times_used || 0) + 1 })
          .eq("code", couponCode.toUpperCase())
      }
    }

    // 3. Insert all associated order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId || null,
      title: item.title,
      image_url: item.image,
      variant_info: item.variantInfo || null,
      quantity: item.quantity,
      unit_price: item.price,
      line_total: item.price * item.quantity
    }))

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems)

    if (itemsError) {
      console.error("Error inserting order items:", itemsError)
      // Rollback newly created order to prevent corrupted records
      await supabase.from("orders").delete().eq("id", order.id)
      return { success: false, error: itemsError.message }
    }

    // 4. Create initial timeline event
    const { error: timelineError } = await supabase
      .from("order_timeline")
      .insert({
        order_id: order.id,
        status: 'pending',
        note: 'Order placed successfully.',
        created_by: userId || null
      })

    if (timelineError) {
      console.error("Error inserting order timeline:", timelineError)
    }

    // Trigger visual automation workflow engine
    const productNames = items.map(item => {
      let variantText = ""
      if (item.variantInfo && typeof item.variantInfo === 'object') {
        const vals = Object.values(item.variantInfo).filter(Boolean)
        if (vals.length > 0) {
          variantText = ` - ${vals.join(" / ")}`
        }
      }
      return `${item.title}${variantText} (x${item.quantity})`
    }).join(", ")
    const workflowPayload = {
      id: order.id,
      order_id: order.id,
      order_number: order.order_number || order.id.slice(0, 8).toUpperCase(),
      email: authEmail,
      customer_email: authEmail,
      customer_phone: shippingInfo.phone,
      customer_name: `${shippingInfo.firstName} ${shippingInfo.lastName || ""}`.trim() || "Customer",
      customer_address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} - ${shippingInfo.zip}`,
      total: finalTotal,
      order_total: `₹${finalTotal.toLocaleString()}`,
      payment_method: paymentMethod === "cod" ? "COD" : "Razorpay",
      payment_status: isFailed ? 'failed' : (paymentMethod === "cod" ? 'pending' : 'paid'),
      coupon_code: couponCode || "None",
      products_list: productNames,
      created_at: order.created_at || new Date().toISOString()
    }
    await triggerWorkflowEvent("ORDER_PLACED", workflowPayload).catch(e => {
      console.error("Workflow trigger execution error:", e)
    })

    return { success: true, orderId: order.id }
  } catch (err: any) {
    console.error("Unexpected error in createOrder server action:", err)
    return { success: false, error: err.message || "An unexpected error occurred during order processing." }
  }
}

export async function cancelOrder(orderId: string, reason: string = "Cancelled by customer") {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: "Internal Server Error: Missing credentials" }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("order_number, fulfillment_status, notes")
      .eq("id", orderId)
      .single()

    if (fetchError || !order) {
      return { success: false, error: "Order not found." }
    }

    if (order.fulfillment_status === 'cancelled') {
      return { success: false, error: "Order is already cancelled." }
    }

    if (order.fulfillment_status === 'delivered' || order.fulfillment_status === 'completed' || order.fulfillment_status === 'shipped') {
      return { success: false, error: "Shipped, delivered, or completed orders cannot be cancelled." }
    }

    // Since a user cancellation requires manual admin approval:
    // Instead of setting status directly to 'cancelled', we set a flag/note and record a timeline event.
    const updatedNotes = order.notes 
      ? `Cancellation Requested: ${reason} | ${order.notes}`
      : `Cancellation Requested: ${reason}`

    const { error: updateError } = await supabase
      .from("orders")
      .update({ notes: updatedNotes })
      .eq("id", orderId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Insert timeline event for cancellation request
    await supabase
      .from("order_timeline")
      .insert({
        order_id: orderId,
        status: 'cancellation_requested',
        note: `Order cancellation requested by customer. Reason: ${reason}`,
        created_by: null
      })

    // Fetch full order data for the workflow payload
    const { data: fullOrder } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single()

    if (fullOrder) {
      const productNames = fullOrder.order_items?.map((item: any) => `${item.title} (x${item.quantity})`).join(", ") || ""
      const workflowPayload = {
        id: fullOrder.id,
        order_id: fullOrder.id,
        order_number: fullOrder.order_number || fullOrder.id.slice(0, 8).toUpperCase(),
        email: fullOrder.email,
        customer_email: fullOrder.email,
        customer_phone: fullOrder.shipping_address?.phone || "N/A",
        customer_name: fullOrder.shipping_address?.firstName ? `${fullOrder.shipping_address.firstName} ${fullOrder.shipping_address.lastName || ""}`.trim() : "Customer",
        customer_address: fullOrder.shipping_address ? `${fullOrder.shipping_address.address}, ${fullOrder.shipping_address.city}, ${fullOrder.shipping_address.state} - ${fullOrder.shipping_address.zip}` : "N/A",
        total: fullOrder.total,
        order_total: `₹${Number(fullOrder.total).toLocaleString()}`,
        payment_method: fullOrder.payment_status === "pending" ? "COD" : "Razorpay",
        coupon_code: fullOrder.coupon_code || "None",
        products_list: productNames,
        reason: reason,
        order_status: "Cancelled",
        created_at: fullOrder.created_at || new Date().toISOString()
      }
      await triggerWorkflowEvent("ORDER_CANCELLED", workflowPayload).catch(e => {
        console.error("Workflow trigger execution error:", e)
      })
    }

    return { success: true }
  } catch (err: any) {
    console.error("Error in cancelOrder action:", err)
    return { success: false, error: err.message || "Failed to cancel order." }
  }
}

export async function fetchUserOrders(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: "Internal Server Error: Missing credentials", data: [] }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err: any) {
    console.error("Error in fetchUserOrders server action:", err)
    return { success: false, error: err.message || "Failed to fetch user orders.", data: [] }
  }
}

export async function fetchOrderById(orderId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: "Internal Server Error: Missing credentials", data: null }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .eq("id", orderId)
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err: any) {
    console.error("Error in fetchOrderById server action:", err)
    return { success: false, error: err.message || "Failed to fetch order details.", data: null }
  }
}

export async function verifyOrder(orderId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    return { success: false, error: "Internal Server Error: Missing credentials" }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("notes, fulfillment_status")
      .eq("id", orderId)
      .single()

    if (fetchError || !order) {
      return { success: false, error: "Order not found." }
    }

    if (order.notes && order.notes.includes("[COD Verified]")) {
      return { success: true, message: "Order already verified." }
    }

    const updatedNotes = order.notes 
      ? `${order.notes} | [COD Verified]`
      : `[COD Verified]`

    const { error: updateError } = await supabase
      .from("orders")
      .update({ notes: updatedNotes })
      .eq("id", orderId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Insert timeline event for verification
    await supabase
      .from("order_timeline")
      .insert({
        order_id: orderId,
        status: order.fulfillment_status || 'pending',
        note: `COD order details verified by customer.`,
        created_by: null
      })

    return { success: true }
  } catch (err: any) {
    console.error("Error in verifyOrder action:", err)
    return { success: false, error: err.message || "Failed to verify order." }
  }
}
