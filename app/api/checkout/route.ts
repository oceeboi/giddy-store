import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const draftId = request.nextUrl.searchParams.get("draftId");

	if (!draftId) {
		return NextResponse.json(
			{ error: "draftId is required" },
			{ status: 400 },
		);
	}

	return NextResponse.json({ draftId });
}
