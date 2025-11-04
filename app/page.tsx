import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to student QR portal as the default landing page
  redirect("/student-qr-portal")
}
