import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { solidity } from 'ethereum-waffle';
import hre from "hardhat";
import { CalcDate, TokenAvgPriceV1, TokenAvgPriceV2, TokenAvgPriceV3 } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(solidity);
chai.use(chaiAsPromised);

let proxyContractAddress : string;

describe ("Contract TokenAvgPrice V1 : Test", function() {
  let smartcontract1 : TokenAvgPriceV1;
  let ownerAddr : SignerWithAddress;
  let accountAddrs : SignerWithAddress[];
  
  const networkName = hre.network.name;
  const chainId = hre.network.config.chainId;
  console.log("Hardhat network : " + networkName + " (" + chainId + ") ");

  this.beforeAll(async function () {
    accountAddrs = await ethers.getSigners();
    ownerAddr = accountAddrs[0];
    console.log("owner address : %s", ownerAddr.address);

    const calcDateFactory = await ethers.getContractFactory('CalcDate', ownerAddr);
    const calcDateContract = await calcDateFactory.deploy() as CalcDate;
    await calcDateContract.deployed();

    const tokenAvgPriceV1Factory = await ethers.getContractFactory("TokenAvgPriceV1", ownerAddr);
    smartcontract1 = await upgrades.deployProxy(tokenAvgPriceV1Factory, [], {initializer: 'initialize'}
    ) as TokenAvgPriceV1;
    await smartcontract1.deployed();

    proxyContractAddress = smartcontract1.address;

    const daysInMonthList = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for(let month = 1; month <= 5; month ++) {
      for(let day = 1; day <= daysInMonthList[month-1]; day ++){
        await smartcontract1.setEverydayPrice(month, day, month * day);
      }
    }
  });

  it ("setEverydayPrice with invalid values", async function() {
    await expect(smartcontract1.setEverydayPrice(2, 29, 100)).to.eventually.be.rejectedWith("unavailable day");
    await expect(smartcontract1.setEverydayPrice(13, 1, 100)).to.eventually.be.rejectedWith("unavailable month");
    await expect(smartcontract1.setEverydayPrice(0, 1, 100)).to.eventually.be.rejectedWith("unavailable month");
    await expect(smartcontract1.setEverydayPrice(1, 0, 100)).to.eventually.be.rejectedWith("unavailable day");
    await expect(smartcontract1.setEverydayPrice(5, 33, 100)).to.eventually.be.rejectedWith("unavailable day");
  });

  it ("getEverydayPrice successful", async function() {
    expect(await smartcontract1.getEverydayPrice(1, 1)).to.eq(1);
    expect(await smartcontract1.getEverydayPrice(2, 28)).to.eq(56);
    expect(await smartcontract1.getEverydayPrice(3, 3)).to.eq(9);
    expect(await smartcontract1.getEverydayPrice(4, 10)).to.eq(40);
    expect(await smartcontract1.getEverydayPrice(5, 25)).to.eq(125);
  });
  
  it ("getEverydayPrice failed", async function() {
    await expect(smartcontract1.getEverydayPrice(2, 29)).to.eventually.be.rejectedWith("unavailable day");
    await expect(smartcontract1.getEverydayPrice(13, 1)).to.eventually.be.rejectedWith("unavailable month");
    await expect(smartcontract1.getEverydayPrice(0, 1)).to.eventually.be.rejectedWith("unavailable month");
    await expect(smartcontract1.getEverydayPrice(1, 0)).to.eventually.be.rejectedWith("unavailable day");
    await expect(smartcontract1.getEverydayPrice(5, 33)).to.eventually.be.rejectedWith("unavailable day");
  });

  it ("getAvgPriceFromTo successful", async function() {
    expect(await smartcontract1.getAvgPriceFromTo(1, 1, 1, 2)).to.eq(1);
    expect(await smartcontract1.getAvgPriceFromTo(1, 1, 1, 3)).to.eq(2);
    expect(await smartcontract1.getAvgPriceFromTo(1, 31, 2, 1)).to.eq(16);
    expect(await smartcontract1.getAvgPriceFromTo(2, 28, 3, 2)).to.eq(21);
    expect(await smartcontract1.getAvgPriceFromTo(1, 1, 1, 30)).to.eq(15);
  });

  it ("getAvgPriceFromTo failed", async function() {
    await expect(smartcontract1.getAvgPriceFromTo(2, 29, 3, 1)).to.eventually.be.rejectedWith("unavailable day");
    await expect(smartcontract1.getAvgPriceFromTo(12, 29, 13, 1)).to.eventually.be.rejectedWith("unavailable month");
    await expect(smartcontract1.getAvgPriceFromTo(0, 25, 1, 5)).to.eventually.be.rejectedWith("unavailable month");
    await expect(smartcontract1.getAvgPriceFromTo(1, 0, 1, 3)).to.eventually.be.rejectedWith("unavailable day");
    await expect(smartcontract1.getAvgPriceFromTo(5, 30, 5, 33)).to.eventually.be.rejectedWith("unavailable day");
  });
});

describe ("Contract TokenAvgPrice V2 : Test", function() {
  let smartcontract2 : TokenAvgPriceV2;
  let ownerAddr : SignerWithAddress;
  let accountAddrs : SignerWithAddress[];
  
  this.beforeAll(async function () {
    accountAddrs = await ethers.getSigners();
    ownerAddr = accountAddrs[0];
    
    const tokenAvgPriceV2Factory = await ethers.getContractFactory("TokenAvgPriceV2", ownerAddr);
    smartcontract2 = await upgrades.upgradeProxy(proxyContractAddress, tokenAvgPriceV2Factory) as TokenAvgPriceV2;
    await smartcontract2.deployed();
  });

  it("Check storage immutability", async function() {
    for(let i = 1; i < 21; i ++) {
      expect(await smartcontract2.getEverydayPrice(1, i)).to.eq(i);
      expect(await smartcontract2.getEverydayPrice(3, i)).to.eq(3 * i);
      expect(await smartcontract2.getEverydayPrice(5, i)).to.eq(5 * i);
    }
  });

  it("Check setEverydayPrice function owner permission", async function() {
    //success
    await smartcontract2.setEverydayPrice(12, 31, 100);
    expect(await smartcontract2.getEverydayPrice(12, 31)).to.eq(100);
    //fail
    await expect(smartcontract2.connect(accountAddrs[1]).setEverydayPrice(12, 31, 200)).to.be.revertedWith('Ownable: caller is not the owner');
    expect(await smartcontract2.getEverydayPrice(12, 31)).to.eq(100);
  });
});

describe ("Contract TokenAvgPrice V3 : Test", function() {
  let smartcontract3 : TokenAvgPriceV3;
  let ownerAddr : SignerWithAddress;
  let accountAddrs : SignerWithAddress[];
  
  this.beforeAll(async function () {
    accountAddrs = await ethers.getSigners();
    ownerAddr = accountAddrs[0];
    
    const tokenAvgPriceV3Factory = await ethers.getContractFactory("TokenAvgPriceV3", ownerAddr);
    smartcontract3 = await upgrades.upgradeProxy(proxyContractAddress, tokenAvgPriceV3Factory) as TokenAvgPriceV3;
    await smartcontract3.deployed();
  });

  it("Check setEverydayPrice function time permission", async function() {
    let now = new Date();
    let nowMonth = now.getUTCMonth() + 1;
    let nowDay = now.getUTCDate();
    //success
    await smartcontract3.setEverydayPrice(nowMonth, nowDay, 100);
    expect(await smartcontract3.getEverydayPrice(nowMonth, nowDay)).to.eq(100);
    //fail
    await expect(smartcontract3.setEverydayPrice( nowMonth, nowDay + 1, 100)).to.be.revertedWith("Please set today's price");
    expect(await smartcontract3.getEverydayPrice(nowMonth, nowDay + 1)).to.eq(nowMonth * (nowDay + 1));
  });
});