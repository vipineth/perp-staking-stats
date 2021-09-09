import { Staker, StakingDayData } from "../generated/schema";
import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";

let ZERO_BI = BigInt.fromI32(0);

export function getStaker(address: Address): Staker {
  let staker = Staker.load(address.toHexString());
  if (!staker) {
    staker = new Staker(address.toHexString());
    staker.totalStaked = ZERO_BI;
    staker.totalWithdrawn = ZERO_BI;
    staker.save();
  }
  return staker as Staker;
}

export function getStakingDayData(
  event: ethereum.Event,
  trader: Address
): StakingDayData {
  let _staker = getStaker(trader);
  let timestamp = event.block.timestamp.toI32();
  let dayID = timestamp / 86400;
  let id = _staker.id + "-" + dayID.toString();

  let dayData = StakingDayData.load(id);
  let dayStartTimestamp = dayID * 86400;

  if (!dayData) {
    dayData = new StakingDayData(id);
    dayData.date = BigInt.fromI32(dayStartTimestamp);
    dayData.totalStaked = ZERO_BI;
    dayData.totalUnstaked = ZERO_BI;
    dayData.totalWithdrawn = ZERO_BI;
    dayData.save();
  }
  return dayData!;
}
