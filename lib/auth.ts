// Clerk is optional: the app runs open (no gate) until these keys are set, then
// it gates sign-in. `NEXT_PUBLIC_*` is inlined so this works on client + server.
export const clerkEnabled =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
