import * as firebaseErrors from "./firebase-errors.json";

export function localizeErrorMap(e) {
  if (
    typeof e === "object" &&
    typeof e.code === "string" &&
    e.code in firebaseErrors
  )
    e.message = firebaseErrors.some(e.code)[e.code];
}
