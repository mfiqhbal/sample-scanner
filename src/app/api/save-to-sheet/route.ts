import { NextRequest, NextResponse } from 'next/server';
import { appendToSheet } from '@/services/sheets';
import { SampleData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { well, company, depthFrom, depthTo, boxCode } = body;

    if (!well || typeof well !== 'string') {
      return NextResponse.json(
        { error: 'Well name is required' },
        { status: 400 }
      );
    }

    if (typeof depthFrom !== 'number' || typeof depthTo !== 'number') {
      return NextResponse.json(
        { error: 'Depth From and Depth To must be numbers' },
        { status: 400 }
      );
    }

    if (depthFrom > depthTo) {
      return NextResponse.json(
        { error: 'Depth From must be less than or equal to Depth To' },
        { status: 400 }
      );
    }

    const data: SampleData = {
      well: well.trim(),
      company: (company || '').trim(),
      depthFrom,
      depthTo,
      boxCode: (boxCode || '').trim(),
    };

    await appendToSheet(data);

    return NextResponse.json({
      success: true,
      message: 'Data saved successfully',
    });
  } catch (error) {
    console.error('Save to sheet error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to save data';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
