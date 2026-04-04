# IQMS by CIRCAI LTD.

This is a mobile-first warehouse and quality web app for product scanning & tracking. It is designed for practical floor use with large tap targets, scan-first workflows, grouped receiving, simple packing, and traceable stock control.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Mobile barcode scanning with `@zxing/browser`
- Sonner toasts
- PDF generation with `pdf-lib`
- Workbook import with `xlsx`
- Google ID token verification with `jose`

## Mobile scanning notes

- Camera scanning uses `@zxing/browser` rather than the browser's native `BarcodeDetector`, because iPhone browsers do not expose that API reliably.
- Use the app over HTTPS or `localhost`, otherwise mobile browsers will block camera access.
- The scanner asks for a user gesture before opening the camera and always keeps manual entry available as a fallback.
- If the camera is already in use by another tab or app, close it there first and reopen the scanner.
