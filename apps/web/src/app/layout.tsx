import type { ReactNode } from "react";

export const metadata = {
  title: "answerya",
  description: "answerya web liveness",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
