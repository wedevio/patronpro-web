## Onboarding Redirect Manual Smoke

1. Open `/thank-you` and confirm the page shows exactly 3 onboarding steps.
2. Verify the page shows `+15622625264`, `info@email.getpatronpro.com`, and the Spam/Promociones reminder.
3. Click the tel/mailto/vCard actions and confirm each opens the expected destination.
4. Open a valid signed onboarding link and submit the form with a reachable email.
5. Confirm the successful response redirects to `https://api.getpatronpro.com/widget/booking/D7x8ts5xcdNOWnd6Pjlq`.
6. Confirm available identity values appear in the redirect query string as `first_name`, `last_name`, and/or `email` only when present.
7. Simulate a response without `redirectUrl` and confirm the local `SuccessScreen` still renders.
