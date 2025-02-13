import { chainInfo } from "../lib/chain_info";
import Web3 from "web3";

const web3 = new Web3(chainInfo.rpc);
const MIN_HEX_LENGTH = 450;

// 解析reportName
async function parseReportNameAddress(hexData) {
  // transaction receipt logs[1] data 長度
  if (hexData && hexData.length >= MIN_HEX_LENGTH) {
    // 偏移量是從data開始的第一個字（32位元組，即64個十六進制字符）
    const offset = parseInt(hexData.slice(2, 66), 16) * 2;
    // console.log('offset', offset);
    // 字符串長度位於偏移量指定的位置
    const length = parseInt(hexData.slice(offset + 2, offset + 66), 16) * 2;
    // console.log('length', length);
    // 字符串內容位於長度之後
    const reportNameHex = hexData.slice(offset + 66, offset + 66 + length);
    // console.log('reportNameHex', reportNameHex);
    // 將十六進制轉換為 ASCII 字符串
    const reportName = web3.utils.hexToAscii("0x" + reportNameHex);
    // console.log('reportName', reportName);
    // 清除不可見字符
    const cleanReportName = reportName.replace(/\0/g, "");
    // report address
    const reportAddress = "0x" + hexData.slice(282, 322);
    return { cleanReportName, reportAddress };
  } else {
    return { cleanReportName: null, reportAddress: null };
  }
}

export { parseReportNameAddress };
