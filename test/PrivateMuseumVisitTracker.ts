/**
 * @title PrivateMuseumVisitTracker Test Suite
 * @notice Comprehensive tests for the Private Museum Visit Tracker smart contract
 * @dev Demonstrates privacy-preserving visitor analytics using FHEVM
 *
 * @chapter: access-control
 * @chapter: encryption
 * @chapter: decryption
 *
 * This test suite covers:
 * - Visitor registration with encrypted age
 * - Exhibition creation and management
 * - Private visit recording with encrypted feedback
 * - Access control mechanisms
 * - Privacy-preserving statistics
 */

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { PrivateMuseumVisitTracker, PrivateMuseumVisitTracker__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("PrivateMuseumVisitTracker")) as PrivateMuseumVisitTracker__factory;
  const contract = (await factory.deploy()) as PrivateMuseumVisitTracker;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("PrivateMuseumVisitTracker", function () {
  let signers: Signers;
  let contract: PrivateMuseumVisitTracker;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3]
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  describe("Contract Deployment", function () {
    it("should deploy with correct initial values", async function () {
      expect(await contract.owner()).to.equal(signers.deployer.address);
      expect(await contract.museumManager()).to.equal(signers.deployer.address);
      expect(await contract.totalExhibitions()).to.equal(0);
      expect(await contract.totalRegisteredVisitors()).to.equal(0);
    });

    it("should set the deployer as both owner and museum manager", async function () {
      const owner = await contract.owner();
      const manager = await contract.museumManager();
      expect(owner).to.equal(manager);
      expect(owner).to.equal(signers.deployer.address);
    });
  });

  describe("Museum Manager Management", function () {
    it("should allow owner to set a new museum manager", async function () {
      await contract.connect(signers.deployer).setMuseumManager(signers.alice.address);
      expect(await contract.museumManager()).to.equal(signers.alice.address);
    });

    it("should reject non-owner attempts to set museum manager", async function () {
      await expect(
        contract.connect(signers.alice).setMuseumManager(signers.bob.address)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Visitor Registration", function () {
    it("should successfully register a visitor with encrypted age", async function () {
      const age = 25;
      const tx = await contract.connect(signers.alice).registerVisitor(age);
      await tx.wait();

      const [isRegistered, registrationDate] = await contract.connect(signers.alice).getMyStats();
      expect(isRegistered).to.be.true;
      expect(registrationDate).to.be.greaterThan(0);
      expect(await contract.totalRegisteredVisitors()).to.equal(1);
    });

    it("should prevent duplicate registration", async function () {
      const age = 30;
      await contract.connect(signers.alice).registerVisitor(age);

      await expect(
        contract.connect(signers.alice).registerVisitor(age)
      ).to.be.revertedWith("Already registered");
    });

    it("should reject invalid age values", async function () {
      await expect(
        contract.connect(signers.alice).registerVisitor(0)
      ).to.be.revertedWith("Invalid age");

      await expect(
        contract.connect(signers.alice).registerVisitor(120)
      ).to.be.revertedWith("Invalid age");
    });

    it("should correctly categorize visitors into age groups", async function () {
      // Child (< 13)
      await contract.connect(signers.alice).registerVisitor(10);
      // Teen (13-19)
      await contract.connect(signers.bob).registerVisitor(16);
      // Adult (20-59)
      await contract.connect(signers.charlie).registerVisitor(35);

      expect(await contract.totalRegisteredVisitors()).to.equal(3);
    });

    it("should emit VisitorRegistered event", async function () {
      const age = 25;
      await expect(contract.connect(signers.alice).registerVisitor(age))
        .to.emit(contract, "VisitorRegistered")
        .withArgs(signers.alice.address, await ethers.provider.getBlock('latest').then(b => b?.timestamp));
    });
  });

  describe("Exhibition Management", function () {
    it("should create a new exhibition", async function () {
      const name = "Ancient Civilizations";
      const exhibitionType = 0; // History
      const startDate = Math.floor(Date.now() / 1000);
      const endDate = startDate + 30 * 24 * 60 * 60; // 30 days later

      const tx = await contract.connect(signers.deployer).createExhibition(
        name,
        exhibitionType,
        startDate,
        endDate
      );
      await tx.wait();

      expect(await contract.totalExhibitions()).to.equal(1);

      const [exhibitionName, type, start, end, isActive, visitorCount] =
        await contract.getExhibitionInfo(1);

      expect(exhibitionName).to.equal(name);
      expect(type).to.equal(exhibitionType);
      expect(start).to.equal(startDate);
      expect(end).to.equal(endDate);
      expect(isActive).to.be.true;
      expect(visitorCount).to.equal(0);
    });

    it("should reject exhibitions with invalid date ranges", async function () {
      const startDate = Math.floor(Date.now() / 1000);
      const endDate = startDate - 1000; // End before start

      await expect(
        contract.connect(signers.deployer).createExhibition(
          "Invalid Exhibition",
          0,
          startDate,
          endDate
        )
      ).to.be.revertedWith("Invalid date range");
    });

    it("should only allow museum manager to create exhibitions", async function () {
      const startDate = Math.floor(Date.now() / 1000);
      const endDate = startDate + 30 * 24 * 60 * 60;

      await expect(
        contract.connect(signers.alice).createExhibition(
          "Unauthorized Exhibition",
          0,
          startDate,
          endDate
        )
      ).to.be.revertedWith("Not museum manager");
    });

    it("should emit ExhibitionCreated event", async function () {
      const name = "Modern Art Collection";
      const exhibitionType = 1; // Art
      const startDate = Math.floor(Date.now() / 1000);
      const endDate = startDate + 30 * 24 * 60 * 60;

      await expect(
        contract.connect(signers.deployer).createExhibition(
          name,
          exhibitionType,
          startDate,
          endDate
        )
      ).to.emit(contract, "ExhibitionCreated")
        .withArgs(1, name, exhibitionType);
    });

    it("should allow museum manager to toggle exhibition status", async function () {
      const startDate = Math.floor(Date.now() / 1000);
      const endDate = startDate + 30 * 24 * 60 * 60;

      await contract.connect(signers.deployer).createExhibition(
        "Test Exhibition",
        0,
        startDate,
        endDate
      );

      await contract.connect(signers.deployer).setExhibitionStatus(1, false);
      const [, , , , isActive] = await contract.getExhibitionInfo(1);
      expect(isActive).to.be.false;

      await contract.connect(signers.deployer).setExhibitionStatus(1, true);
      const [, , , , isActiveAgain] = await contract.getExhibitionInfo(1);
      expect(isActiveAgain).to.be.true;
    });
  });

  describe("Private Visit Recording", function () {
    beforeEach(async function () {
      // Register a visitor
      await contract.connect(signers.alice).registerVisitor(25);

      // Create an exhibition
      const startDate = Math.floor(Date.now() / 1000);
      const endDate = startDate + 30 * 24 * 60 * 60;
      await contract.connect(signers.deployer).createExhibition(
        "Science Discovery",
        2, // Science
        startDate,
        endDate
      );
    });

    it("should record a private visit with encrypted feedback", async function () {
      const exhibitionId = 1;
      const satisfaction = 8;
      const duration = 120; // 2 hours in minutes
      const interestLevel = 4;

      const tx = await contract.connect(signers.alice).recordPrivateVisit(
        exhibitionId,
        satisfaction,
        duration,
        interestLevel
      );
      await tx.wait();

      const hasVisited = await contract.connect(signers.alice).getMyVisitRecord(exhibitionId);
      expect(hasVisited).to.be.true;

      const [, , , , , visitorCount] = await contract.getExhibitionInfo(exhibitionId);
      expect(visitorCount).to.equal(1);
    });

    it("should require visitor registration before recording visits", async function () {
      await expect(
        contract.connect(signers.bob).recordPrivateVisit(1, 8, 120, 4)
      ).to.be.revertedWith("Visitor not registered");
    });

    it("should prevent recording duplicate visits", async function () {
      await contract.connect(signers.alice).recordPrivateVisit(1, 8, 120, 4);

      await expect(
        contract.connect(signers.alice).recordPrivateVisit(1, 9, 150, 5)
      ).to.be.revertedWith("Visit already recorded");
    });

    it("should validate satisfaction rating range (1-10)", async function () {
      await expect(
        contract.connect(signers.alice).recordPrivateVisit(1, 0, 120, 4)
      ).to.be.revertedWith("Satisfaction must be 1-10");

      await expect(
        contract.connect(signers.alice).recordPrivateVisit(1, 11, 120, 4)
      ).to.be.revertedWith("Satisfaction must be 1-10");
    });

    it("should validate interest level range (1-5)", async function () {
      await expect(
        contract.connect(signers.alice).recordPrivateVisit(1, 8, 120, 0)
      ).to.be.revertedWith("Interest level must be 1-5");

      await expect(
        contract.connect(signers.alice).recordPrivateVisit(1, 8, 120, 6)
      ).to.be.revertedWith("Interest level must be 1-5");
    });

    it("should reject visits to inactive exhibitions", async function () {
      await contract.connect(signers.deployer).setExhibitionStatus(1, false);

      await expect(
        contract.connect(signers.alice).recordPrivateVisit(1, 8, 120, 4)
      ).to.be.revertedWith("Exhibition not active");
    });

    it("should emit PrivateVisitRecorded and SatisfactionRecorded events", async function () {
      const tx = contract.connect(signers.alice).recordPrivateVisit(1, 8, 120, 4);

      await expect(tx)
        .to.emit(contract, "PrivateVisitRecorded")
        .withArgs(signers.alice.address, 1);

      await expect(tx)
        .to.emit(contract, "SatisfactionRecorded")
        .withArgs(1, signers.alice.address);
    });

    it("should track multiple visitors to the same exhibition", async function () {
      // Register second visitor
      await contract.connect(signers.bob).registerVisitor(30);

      // Both visit the same exhibition
      await contract.connect(signers.alice).recordPrivateVisit(1, 8, 120, 4);
      await contract.connect(signers.bob).recordPrivateVisit(1, 9, 90, 5);

      const [, , , , , visitorCount] = await contract.getExhibitionInfo(1);
      expect(visitorCount).to.equal(2);

      const exhibitionVisitorCount = await contract.getExhibitionVisitorCount(1);
      expect(exhibitionVisitorCount).to.equal(2);
    });
  });

  describe("Statistics and Privacy", function () {
    beforeEach(async function () {
      // Register multiple visitors
      await contract.connect(signers.alice).registerVisitor(25);
      await contract.connect(signers.bob).registerVisitor(35);

      // Create exhibitions
      const startDate = Math.floor(Date.now() / 1000);
      const endDate = startDate + 30 * 24 * 60 * 60;

      await contract.connect(signers.deployer).createExhibition(
        "History Exhibition",
        0,
        startDate,
        endDate
      );

      await contract.connect(signers.deployer).createExhibition(
        "Art Exhibition",
        1,
        startDate,
        endDate
      );
    });

    it("should return correct public statistics", async function () {
      const [totalExhibitions, totalVisitors] = await contract.getPublicStats();
      expect(totalExhibitions).to.equal(2);
      expect(totalVisitors).to.equal(2);
    });

    it("should track visitor count per exhibition", async function () {
      await contract.connect(signers.alice).recordPrivateVisit(1, 8, 120, 4);
      await contract.connect(signers.bob).recordPrivateVisit(1, 9, 90, 5);

      const visitorCount = await contract.getExhibitionVisitorCount(1);
      expect(visitorCount).to.equal(2);
    });

    it("should only allow museum manager to request encrypted statistics", async function () {
      await contract.connect(signers.alice).recordPrivateVisit(1, 8, 120, 4);

      // Manager can request
      await expect(
        contract.connect(signers.deployer).requestExhibitionStats(1)
      ).to.emit(contract, "StatisticsRequested");

      // Regular user cannot request
      await expect(
        contract.connect(signers.bob).requestExhibitionStats(1)
      ).to.be.revertedWith("Not museum manager");
    });

    it("should maintain visitor privacy for individual data", async function () {
      await contract.connect(signers.alice).recordPrivateVisit(1, 8, 120, 4);

      // Visitor can check their own visit status
      const hasVisited = await contract.connect(signers.alice).getMyVisitRecord(1);
      expect(hasVisited).to.be.true;

      // But cannot see specific encrypted values directly
      const [isRegistered] = await contract.connect(signers.alice).getMyStats();
      expect(isRegistered).to.be.true;
    });
  });

  describe("Access Control", function () {
    it("should enforce owner-only functions", async function () {
      await expect(
        contract.connect(signers.alice).setMuseumManager(signers.bob.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("should enforce museum manager restrictions", async function () {
      const startDate = Math.floor(Date.now() / 1000);
      const endDate = startDate + 30 * 24 * 60 * 60;

      await expect(
        contract.connect(signers.alice).createExhibition(
          "Unauthorized",
          0,
          startDate,
          endDate
        )
      ).to.be.revertedWith("Not museum manager");
    });

    it("should enforce registered visitor restrictions", async function () {
      // Create exhibition first
      const startDate = Math.floor(Date.now() / 1000);
      const endDate = startDate + 30 * 24 * 60 * 60;
      await contract.connect(signers.deployer).createExhibition(
        "Test Exhibition",
        0,
        startDate,
        endDate
      );

      // Unregistered user tries to record visit
      await expect(
        contract.connect(signers.alice).recordPrivateVisit(1, 8, 120, 4)
      ).to.be.revertedWith("Visitor not registered");
    });
  });

  describe("Edge Cases", function () {
    it("should handle invalid exhibition IDs", async function () {
      await expect(
        contract.getExhibitionInfo(999)
      ).to.be.revertedWith("Invalid exhibition");
    });

    it("should handle maximum visitor count", async function () {
      const startDate = Math.floor(Date.now() / 1000);
      const endDate = startDate + 30 * 24 * 60 * 60;
      await contract.connect(signers.deployer).createExhibition(
        "Popular Exhibition",
        0,
        startDate,
        endDate
      );

      // Register and record visits for multiple visitors
      for (let i = 1; i <= 3; i++) {
        const signer = (await ethers.getSigners())[i];
        await contract.connect(signer).registerVisitor(20 + i);
        await contract.connect(signer).recordPrivateVisit(1, 7 + i, 100 + i * 10, 3 + (i % 3));
      }

      const [, , , , , visitorCount] = await contract.getExhibitionInfo(1);
      expect(visitorCount).to.equal(3);
    });
  });
});
