export function parseEnvConfig(env: Record<string, string>): ImportMetaEnv {
  const res: ImportMetaEnv = {};
  for (const key in env) {
    if (Object.prototype.hasOwnProperty.call(env, key)) {
      const item = env[key];
      const jsonStr = item.replace(/'/g, '"');
      try {
        const json = JSON.parse(jsonStr);
        res[key] = json;
      }
      catch {
        res[key] = item;
      }
    }
  }
  return res;
}
