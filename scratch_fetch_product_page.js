const http = require("http");

function fetchPage() {
  console.log("Fetching http://localhost:3000/products/black-sesame-oil...");
  
  http.get("http://localhost:3000/products/black-sesame-oil", (res) => {
    const { statusCode } = res;
    console.log(`Status Code: ${statusCode}`);
    
    if (statusCode !== 200) {
      console.error(`Request Failed. Status Code: ${statusCode}`);
      res.consume();
      return;
    }

    res.setEncoding("utf8");
    let rawData = "";
    res.on("data", (chunk) => { rawData += chunk; });
    res.on("end", () => {
      console.log("HTML response length:", rawData.length);
      
      const hasConfiguration = rawData.includes("Select Configuration");
      console.log("Contains 'Select Configuration':", hasConfiguration);
      
      const hasVariantLabel = rawData.includes("30ml");
      console.log("Contains variant label '30ml':", hasVariantLabel);
      
      if (hasConfiguration && hasVariantLabel) {
        console.log("SUCCESS: Product variants are rendering correctly on the page!");
      } else {
        console.log("WARNING: Select Configuration or 30mk not found in HTML output.");
      }
    });
  }).on("error", (e) => {
    console.error(`Got error: ${e.message}`);
  });
}

// Give a short delay to let Next.js dev server compile
setTimeout(fetchPage, 1000);
