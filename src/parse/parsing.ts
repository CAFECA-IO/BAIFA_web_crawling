import {
  getBlockRawData,
  getTransactionRawDatas,
  getTransactionReceiptRawDatas,
} from "./get_raw_data";

import {
  toBlocks,
  toContracts,
  toTransactions,
  updateTotalAmount,
} from "./parsers";

// import { PrismaClient } from "@prisma/client";
import prisma from "../client";

// import chainData
import { chainData } from "../parser";

// const prisma = new PrismaClient();

async function parseDatasByBlockNumber(number: number, web3: any) {
  const block = await getBlockRawData(number);
  // Deprecated: check block (20240109 - Gibbs)
  // eslint-disable-next-line no-console
  // console.log("block:", block);
  const transactions = await getTransactionRawDatas(number);
  // console.log("transactions:", transactions);
  const transactionReceipts = await getTransactionReceiptRawDatas(number);
  // console.log("transactionReceipts:", transactionReceipts);
  const parsedBlock = await toBlocks(
    number,
    block,
    chainData.chain_id,
    chainData,
    web3,
  );
  await toContracts(block, transactionReceipts, web3, chainData.chain_id);
  await toTransactions(transactions, block, transactionReceipts, web3);
  // put report data into evidence content
  // await put_content();
  // update total amount for 原生幣種 in currencies table after parsing each block
  await updateTotalAmount(parsedBlock);
  // Deprecated: print block number of parse datas (20240131 - Gibbs)
  // eslint-disable-next-line no-console
  console.log("parse datas by block number:", number, "success");
}

async function parsing(web3: any) {
  /* Info: (20240118 - Gibbs) use block number to record process
    1. get startBlockNumber: max block number of prisma.blocks or first time: 0
    2. get endBlockNumber: latest block number of prisma.block_raw
    3. get datas from startBlockNumber to endBlockNumber
    4. error: record error block number
    */
  const startBlockNumber =
    (
      await prisma.blocks.findFirst({
        where: { chain_id: chainData.chain_id },
        select: { number: true },
        orderBy: { number: "desc" },
      })
    )?.number || 0;
  console.log("startBlockNumber:", startBlockNumber);
  const endBlockNumber =
    (
      await prisma.block_raw.findFirst({
        where: { chain_id: chainData.chain_id },
        select: { number: true },
        orderBy: { number: "desc" },
      })
    )?.number || 0;
  console.log("endBlockNumber:", endBlockNumber);
  // for (let i = startBlockNumber; i <= endBlockNumber; i++) {
  //   try {
  //     await parseDatasByBlockNumber(i, web3);
  //     // Deprecated: print block number of parse datas (20240118 - Gibbs)
  //     // eslint-disable-next-line no-console
  //     console.log(`parse datas by block number: ${i} success`);
  //   } catch (error) {
  //     // Deprecated: print error block number (20240118 - Gibbs)
  //     // eslint-disable-next-line no-console
  //     console.log("error block number:", i, error);
  //   }
  // }
  for (let i = startBlockNumber; i <= endBlockNumber; i++) {
    try {
      // pack parseDatasByBlockNumber function in a transaction
      await prisma.$transaction(
        async () => {
          await parseDatasByBlockNumber(i, web3);
        },
        // info: (20240319 - Gibbs) set transaction timeout to 10 minutes
        { timeout: 1000 * 60 * 10 },
      );
      // Deprecated: print block number of parse datas (20240118 - Gibbs)
      // eslint-disable-next-line no-console
      console.log("parsing correct block number:", i);
    } catch (error) {
      // Deprecated: print error block number (20240118 - Gibbs)
      // eslint-disable-next-line no-console
      console.log("parsing error block number:", i, error);
      continue;
    }
  }

  // test
  // await put_content();
  // await parseDatasByBlockNumber(661171, web3);
}

export { parsing };
