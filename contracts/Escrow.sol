// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "hardhat/console.sol";

interface IERC721 {
    function transferFrom(address _from, address _to, uint256 id) external;
}

contract Escrow {
    address public nftAddress;
    address payable public seller;
    address public inspector;
    address public lender;

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purcharsePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;
    mapping(uint256 => uint256) public lended;

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller allowed");
        _;
    }

    modifier onlyBuyer(uint256 _nftId) {
        require(msg.sender == buyer[_nftId], "Only buyer allowed");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector);
        _;
    }

    modifier onlyLender() {
        require(msg.sender == lender);
        _;
    }

    modifier onlyFinalizer(uint256 _nftId) {
        require(
            msg.sender == buyer[_nftId] ||
                msg.sender == lender ||
                msg.sender == seller
        );
        _;
    }

    modifier onlyCanceler(uint256 _nftId) {
        require(msg.sender == buyer[_nftId] || msg.sender == seller);
        _;
    }

    constructor(
        address _nftAddress,
        address payable _seller,
        address _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }

    function list(
        uint256 _nftId,
        address _buyer,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) external payable onlySeller {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftId);
        isListed[_nftId] = true;
        purcharsePrice[_nftId] = _purchasePrice;
        escrowAmount[_nftId] = _escrowAmount;
        buyer[_nftId] = _buyer;
    }

    function depositEarnest(uint256 _nftId) external payable onlyBuyer(_nftId) {
        require(msg.value >= escrowAmount[_nftId]);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function updateInspectionStatus(
        uint256 _nftId,
        bool _passed
    ) external onlyInspector {
        inspectionPassed[_nftId] = _passed;
    }

    function approveSale(uint256 _nftId) external {
        approval[_nftId][msg.sender] = true;
    }

    function finalizeSale(uint256 _nftId) external onlyFinalizer(_nftId) {
        require(isListed[_nftId]);
        require(inspectionPassed[_nftId]);
        require(approval[_nftId][buyer[_nftId]]);
        require(approval[_nftId][seller]);
        require(approval[_nftId][lender]);
        require(address(this).balance >= purcharsePrice[_nftId]);
        isListed[_nftId] = false;
        (bool success, ) = payable(seller).call{value: address(this).balance}(
            ""
        );
        require(success);
        IERC721(nftAddress).transferFrom(address(this), buyer[_nftId], _nftId);
    }

    function lend(uint256 _nftId) external payable onlyLender {
        require(msg.value == purcharsePrice[_nftId] - escrowAmount[_nftId]);
    }

    function cancelSale(uint256 _nftId) public onlyCanceler(_nftId) {
        if (inspectionPassed[_nftId] && msg.sender == buyer[_nftId]) {
            payable(seller).transfer(address(this).balance);
        } else {
            payable(buyer[_nftId]).transfer(address(this).balance);
        }
        if (lended[_nftId] >= 0) {
            uint256 lendedTemp = lended[_nftId];
            lended[_nftId] = 0;
            (bool success, ) = payable(lender).call{value: lendedTemp}("");
            require(success);
        }
    }

    receive() external payable {}
}
