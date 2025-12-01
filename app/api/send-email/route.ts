import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html, type, data } = await req.json()

    // Build email based on type
    let emailHtml = html

    if (type === "request_submitted") {
      emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">New Asset Request Submitted</h2>
          <p>A new request has been submitted and requires your attention.</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Requester:</strong> ${data.requesterName}</p>
            <p><strong>Asset Type:</strong> ${data.assetTypeName}</p>
            <p><strong>Submitted:</strong> ${new Date(data.createdAt).toLocaleString()}</p>
          </div>
          <a href="${process.env.SITE_URL}/dashboard/approvals" 
             style="display: inline-block; background: #0070f3; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            Review Request
          </a>
        </div>
      `
    } else if (type === "request_approved") {
      emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Request Approved</h2>
          <p>Your asset request has been approved.</p>
          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Asset Type:</strong> ${data.assetTypeName}</p>
            <p><strong>Approved by:</strong> ${data.approverName}</p>
            ${data.comment ? `<p><strong>Comment:</strong> ${data.comment}</p>` : ""}
          </div>
          <a href="${process.env.SITE_URL}/dashboard/my-requests" 
             style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            View Request
          </a>
        </div>
      `
    } else if (type === "request_denied") {
      emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Request Denied</h2>
          <p>Your asset request has been denied.</p>
          <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Asset Type:</strong> ${data.assetTypeName}</p>
            <p><strong>Denied by:</strong> ${data.approverName}</p>
            <p><strong>Reason:</strong> ${data.comment}</p>
          </div>
          <a href="${process.env.SITE_URL}/dashboard/my-requests" 
             style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            View Request
          </a>
        </div>
      `
    }

    const { data: emailData, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Asset System <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html: emailHtml,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: emailData })
  } catch (error) {
    console.error("Email send error:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
