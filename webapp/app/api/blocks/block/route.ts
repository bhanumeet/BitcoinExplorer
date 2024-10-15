import { NextResponse } from "next/server";
import pool from "@/lib/dbConnect";

// path: /api/blocks/block


// get block details
export async function getBlockDetails() {
    let blockHeight;
    try {
        await pool.connect();
        blockHeight = await pool.query("select * from blocks order by id desc limit 1");
    } catch (error : unknown) {
        return NextResponse.json({ message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
    console.log(JSON.stringify(blockHeight.rows));
    return NextResponse.json({ message: blockHeight.rows }, { status: 200 });
}




export { getBlockDetails as GET };
