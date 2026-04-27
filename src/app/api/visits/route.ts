import { NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const res = await db.select().from(settings).where(eq(settings.key, 'visit_count')).limit(1);
    const count = res.length > 0 ? parseInt(res[0].value, 10) : 0;
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ count: 0 });
  }
}

export async function POST() {
  try {
    const res = await db.select().from(settings).where(eq(settings.key, 'visit_count')).limit(1);
    const currentCount = res.length > 0 ? parseInt(res[0].value, 10) : 0;
    const newCount = currentCount + 1;

    await db.insert(settings)
      .values({ key: 'visit_count', value: newCount.toString() })
      .onConflictDoUpdate({ target: settings.key, set: { value: newCount.toString() } });

    return NextResponse.json({ count: newCount });
  } catch (error) {
    return NextResponse.json({ count: 0 });
  }
}
