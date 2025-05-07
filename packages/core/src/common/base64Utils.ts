function arrayBufferToBase64(buffer: any): string {
  const n = new Uint8Array(buffer);
  let r = '';
  for (let e = 0; e < n.length; e++) r += String.fromCharCode(n[e]);
  return btoa(r);
}

function base64ToArrayBuffer(base64String: string) {
  const n = atob(base64String);
  const r = new Uint8Array(n.length);

  for (let e = 0; e < n.length; e++) {
    r[e] = n.charCodeAt(e);
  }
  return r.buffer;
}

export { arrayBufferToBase64, base64ToArrayBuffer };
