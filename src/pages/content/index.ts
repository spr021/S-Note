import { startSNote } from "./app";

void startSNote().catch((error) => {
  console.error("S Note could not start on this page.", error);
});
