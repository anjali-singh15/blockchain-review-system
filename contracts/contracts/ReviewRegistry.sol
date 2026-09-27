// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ReviewRegistry {
    mapping(string => bool) private reviewHashes;

    event ReviewHashStored(string indexed reviewHash, address indexed reviewer, uint256 timestamp);

    function storeReviewHash(string calldata reviewHash) external {
        require(bytes(reviewHash).length > 0, "Review hash is required");
        require(!reviewHashes[reviewHash], "Review hash already exists");

        reviewHashes[reviewHash] = true;

        emit ReviewHashStored(reviewHash, msg.sender, block.timestamp);
    }

    function verifyReviewHash(string calldata reviewHash) external view returns (bool) {
        return reviewHashes[reviewHash];
    }
}
