import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, role, message } = body;

    if (!name || !email || !company || !role || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error('Telegram credentials not configured');
      return NextResponse.json({ error: 'Contact service unavailable.' }, { status: 503 });
    }

    const text = [
      '*New SAP Connect Inquiry*',
      '',
      `*Name:* ${name}`,
      `*Email:* ${email}`,
      `*Company:* ${company}`,
      `*Role:* ${role}`,
      '',
      '*Message:*',
      message,
    ].join('\n');

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });

    const data = await res.json();

    if (!data.ok) {
      console.error('Telegram API error:', data);
      return NextResponse.json({ error: 'Failed to send message.' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
