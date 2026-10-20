// Explicit public projections: never copy private documents wholesale.
export function publicProfileData(data) {
  return {
    username: data.username,
    displayName: data.displayName,
    institution: data.institution,
    isPublic: data.isPublic,
  };
}
export function publicObservationData(data) {
  return {
    eventId: data.eventId,
    eventName: data.eventName,
    dateTime: data.dateTime,
    siteName: data.siteName,
    tag: data.tag,
  };
}
export async function publicObservationId(id) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(id),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function samePublicData(left, right) {
  return (
    !!left &&
    Object.keys(left).length === Object.keys(right).length &&
    Object.keys(right).every((key) =>
      left[key]?.isEqual
        ? left[key].isEqual(right[key])
        : left[key] === right[key],
    )
  );
}
