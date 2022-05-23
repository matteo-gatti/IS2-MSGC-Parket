const config = {
    development: {
        port: process.env.PORT || 5000,
        saltingRounds: 10
    },
    production: {
        port: process.env.PORT || 5000,
        saltingRounds: 10
    },
    test: {
        port: process.env.PORT || 5000,
        saltingRounds: 10
    }
  };
  
  export default config