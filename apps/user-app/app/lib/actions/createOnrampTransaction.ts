"use server";
import prisma from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";

export async function createOnrampTransaction(
  provider: string,
  amount: number
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;
  
  if (!userId) {
      return {
          message: "User not logged in",
        };
  }
  const token = (Math.random() * 1000).toString(); // in real world this should come from bank

  await prisma.onRampTransaction.create({
    data: {
      userId: Number(userId),
      amount: amount * 100,
      status: "Processing",
      startTime: new Date(),
      provider,
      token,
    },
  });

  return {
    message: "Onramp transaction created successfully",
  };
}
