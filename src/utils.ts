export function getValueAtPath(obj: any, path: string): any {
  try {
    return path
      .replace(/\[(\d+)\]/g, ".$1") // convert arr[0] to arr.0
      .split(".")
      .reduce((acc, key) => acc?.[key], obj);
  } catch {
    return undefined;
  }
}
