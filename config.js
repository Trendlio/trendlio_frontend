const ENV = {
  dev: {
    apiUrl: "http://192.168.84.234:8080/api",
    socketUrl: "ws://192.168.84.234:8080",
  },
  staging: {
    apiUrl: "https://staging-api.taskhub.com/api",
    socketUrl: "wss://staging-api.taskhub.com",
  },
  prod: {
    apiUrl: "https://api.taskhub.com/api",
    socketUrl: "wss://api.taskhub.com",
  },
};

// Determines which environment we're running in. Default to 'dev'
const getEnvVars = (env = process.env.NODE_ENV || "development") => {
  if (env === "development") {
    return ENV.dev;
  } else if (env === "staging") {
    return ENV.staging;
  } else if (env === "production") {
    return ENV.prod;
  }
  return ENV.dev;
};

export default getEnvVars();
