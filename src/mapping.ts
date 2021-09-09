import { BigInt } from "@graphprotocol/graph-ts";
import {
  Staked as StakedEvent,
  Unstaked as UnstakedEvent,
  Withdrawn as WithdrawnEvent,
  PerpStaking as PerpStakingContract,
} from "../generated/PerpStaking/PerpStaking";
import {
  PerpStakingInfo,
  StakeTransaction,
  UnstakeTransaction,
  WithdrawTransaction,
} from "../generated/schema";
import { getStaker, getStakingDayData } from "./helper";

let ZERO_BI = BigInt.fromI32(0);

function getPerpStaking(): PerpStakingInfo {
  let perpStakingInfo = PerpStakingInfo.load("1");
  if (!perpStakingInfo) {
    perpStakingInfo.totalStakedTokens = ZERO_BI;
    perpStakingInfo.totalWithdrawnTokens = ZERO_BI;
  }
  return perpStakingInfo as PerpStakingInfo;
}

export function handleStaked(event: StakedEvent): void {
  // Update Staker
  let staker = getStaker(event.params.staker);
  staker.totalStaked = staker.totalStaked.plus(event.params.amount);

  // Update Staked Transaction
  let stakeTx = new StakeTransaction(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  stakeTx.staker = event.params.staker;
  stakeTx.amount = event.params.amount;
  stakeTx.transactionHash = event.transaction.hash.toString();

  // Update Staking Day Data
  let stakingDayData = getStakingDayData(event, event.params.staker);
  stakingDayData.totalStaked = stakingDayData.totalStaked.plus(
    event.params.amount
  );

  let contract = PerpStakingContract.bind(event.address);
  let totalSupply = contract.totalSupply();

  let perpStaking = getPerpStaking();
  perpStaking.totalStakedTokens = totalSupply;

  stakeTx.save(); // Save the changes
  staker.save();
  stakingDayData.save();
}

export function handleUnstaked(event: UnstakedEvent): void {
  // Update Staker
  let staker = getStaker(event.params.staker);
  staker.totalStaked = staker.totalStaked.minus(event.params.amount);

  // Upadte Unstake Transaction
  let unstakeTx = new UnstakeTransaction(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );

  let contract = PerpStakingContract.bind(event.address);
  let cooldownPeriod = contract.cooldownPeriod();

  unstakeTx.staker = event.params.staker;
  unstakeTx.amount = event.params.amount;
  unstakeTx.tokenUnlockTimestamp = event.block.timestamp.plus(cooldownPeriod);
  unstakeTx.transactionHash = event.transaction.hash.toString();

  // Update Staking Day Data
  let stakingDayData = getStakingDayData(event, event.params.staker);
  stakingDayData.totalUnstaked = stakingDayData.totalUnstaked.plus(
    event.params.amount
  );

  let totalSupply = contract.totalSupply();

  let perpStaking = getPerpStaking();
  perpStaking.totalStakedTokens = totalSupply;

  staker.save();
  unstakeTx.save();
  stakingDayData.save();
}

export function handleWithdrawn(event: WithdrawnEvent): void {
  // Update Staker
  let staker = getStaker(event.params.staker);
  staker.totalWithdrawn = staker.totalWithdrawn.plus(event.params.amount);

  // Update Withdraw Transaction
  let withdrawTx = new WithdrawTransaction(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  withdrawTx.staker = event.params.staker;
  withdrawTx.amount = event.params.amount;
  withdrawTx.transactionHash = event.transaction.hash.toString();

  // Update Staking Day Data
  let stakingDayData = getStakingDayData(event, event.params.staker);
  stakingDayData.totalWithdrawn = stakingDayData.totalWithdrawn.plus(
    event.params.amount
  );

  // Update PerpStakingInfo

  let perpStaking = getPerpStaking();
  perpStaking.totalWithdrawnTokens = perpStaking.totalWithdrawnTokens.plus(
    event.params.amount
  );

  staker.save();
  withdrawTx.save();
  stakingDayData.save();
}
