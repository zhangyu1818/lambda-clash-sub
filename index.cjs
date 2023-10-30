const YAML = require("yamljs");
const axios = require("axios");
const defaultConfig = require("./config.json");

function linkToConfig(link) {
  if (link.startsWith("ss://")) {
    const [encodedPart, name] = link.slice(5).split("#");
    const decoded = Buffer.from(encodedPart, "base64").toString("utf8");
    const [methodPassword, hostPort] = decoded.split("@");
    const [method, password] = methodPassword.split(":");
    const [host, port] = hostPort.split(":");

    return {
      name,
      type: "ss",
      server: host,
      port: parseInt(port, 10),
      cipher: method,
      password: password,
    };
  } else if (link.startsWith("vmess://")) {
    const encodedPart = link.slice(8);
    const decoded = Buffer.from(encodedPart, "base64").toString("utf8");
    const config = JSON.parse(decoded);
    return {
      name: config.ps,
      type: "vmess",
      server: config.add,
      port: parseInt(config.port, 10),
      uuid: config.id,
      alterId: config.aid,
      cipher: "auto",
      tls: config.tls !== "none",
      network: config.net,
      wsPath: config.path,
    };
  }
}

function deleteUndefined(config) {
  for (const key in config) {
    if (config[key] === undefined) {
      delete config[key];
    }
  }
  return config;
}

const convert = (input) =>
  input.trim().split("\n").map(linkToConfig).map(deleteUndefined);

exports.handler = async (event) => {
  const subscribePath = event.pathParameters.path;
  const params = Object.entries(event.queryStringParameters).reduce(
    (p, [key, value]) => ((p += (p === "" ? "?" : "&") + `${key}=${value}`), p),
    "",
  );

  const v2rayLink = subscribePath + params;
  const response = await axios.get(v2rayLink);

  const v2rayConfig = convert(
    Buffer.from(response.data, "base64").toString("utf-8"),
  );

  defaultConfig.proxies = v2rayConfig;

  defaultConfig["proxy-groups"][0].proxies = v2rayConfig.map(
    (config) => config.name,
  );

  const yamlString = YAML.stringify(defaultConfig, 4);
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/x-yaml",
      "Content-Disposition": "attachment; SUB-JMS.yaml",
    },
    body: yamlString,
  };
};
