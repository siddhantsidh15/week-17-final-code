"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../auth"
import prisma from "@repo/db/client";


export async function p2pTransfer(to: string, amount: number){
    // to is the phone number
    const session = await getServerSession(authOptions);
    const from = session?.user.id;

    if(!from){
        return {
            message: "Error while sending"
        }
    }

    // find the user who has the 'to' phoneNumber
    const toUser = await prisma.user.findFirst({
        where: {
            number: to
        }
    })

    if(!toUser){
        return {
            message: "User not found"
        }
    }

    await prisma.$transaction(async (tx) => { // ensures all db operations inside either succeed or fail together
        //lock the row using sql query as prisma doesnt give a way to lock row directly
        await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${Number(from)} FOR UPDATE`;
        // find balance of the sender
        const fromBalance = await tx.balance.findUnique({
            where : {userId: Number(from)}
        });
        if(!fromBalance || fromBalance.amount < amount){
            throw new Error("Insufficient balance")
        }

        // reduce the sender amount
        await tx.balance.update({
            where: {userId: Number(from)},
            data: {amount : {decrement: amount}}
        })

        //increase the receiver amount
        await tx.balance.update({
            where: {userId: toUser?.id},
            data: {amount : {increment: amount}}
        })
    })
}