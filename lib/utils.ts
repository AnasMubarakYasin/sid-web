let debounceid: any;
export function debounce(h: (...args: any[]) => any, w: number) {
  clearTimeout(debounceid);
  debounceid = setTimeout(() => {
    h();
  }, w);
}
