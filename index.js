// index.js
window.userWalletAddress = null;

// 當瀏覽器加載完成時
window.onload = async (event) => {
  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
  } else {
    alert("請安裝 MetaMask 或其他 Ethereum 擴展錢包");
  }

  window.userWalletAddress = window.localStorage.getItem("userWalletAddress");
  showUserDashboard();
};

// 登入功能
const loginWithEth = async () => {
  if (window.web3) {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length === 0) throw new Error("未找到帳戶");
      window.userWalletAddress = accounts[0];
      window.localStorage.setItem("userWalletAddress", window.userWalletAddress);
      showUserDashboard();
    } catch (error) {
      alert(error.message);
    }
  } else {
    alert("請安裝 MetaMask 或其他 Ethereum 擴展錢包");
  }
};

// 登出功能
const logout = () => {
  window.userWalletAddress = null;
  window.localStorage.removeItem("userWalletAddress");
  showUserDashboard();
};

// 更新控制台 UI
const showUserDashboard = () => {
  const isLoggedIn = !!window.userWalletAddress;
  document.querySelector(".login-section").style.display = isLoggedIn ? "none" : "flex";
  document.querySelector(".dashboard-section").style.display = isLoggedIn ? "flex" : "none";
  document.querySelector(".receive-section").style.display = "none";

  if (isLoggedIn) {
    document.querySelector(".wallet-address").textContent = window.userWalletAddress;
    getWalletBalance();
  }
};

// 顯示錢包餘額
const getWalletBalance = async () => {
  if (!window.userWalletAddress) return;
  try {
    const balance = await window.web3.eth.getBalance(window.userWalletAddress);
    document.querySelector(".wallet-balance").textContent = web3.utils.fromWei(balance, "ether");
    document.querySelector(".wallet-balance-heading").style.display = "block";
  } catch (error) {
    console.error("無法獲取餘額：", error);
  }
};

// 生成收款地址和 QR 碼，同時顯示付款功能
const generateReceiveAddress = async () => {
  if (!window.userWalletAddress) {
    alert("請先登入錢包");
    return;
  }

  const receiveAddress = window.userWalletAddress;
  document.querySelector(".receive-address").textContent = receiveAddress;

  const qrcodeCanvas = document.getElementById("qrcode");
  qrcodeCanvas.innerHTML = "";
  QRCode.toCanvas(qrcodeCanvas, receiveAddress, { width: 200 }, (error) => {
    if (error) console.error(error);
  });

  document.querySelector(".receive-section").style.display = "block";
  document.querySelector(".payment-section").style.display = "block";
};

// 執行付款功能
const payWithEth = async () => {
  const paymentAddress = document.getElementById("payment-address").value;
  const paymentAmount = document.getElementById("payment-amount").value;

  if (!paymentAddress || !paymentAmount) {
    alert("請輸入有效的付款地址和金額");
    return;
  }

  try {
    const transaction = await window.web3.eth.sendTransaction({
      from: window.userWalletAddress,
      to: paymentAddress,
      value: web3.utils.toWei(paymentAmount, "ether"),
    });
    alert(`付款成功：\n交易哈希: ${transaction.transactionHash}`);
  } catch (error) {
    alert(`付款失敗: ${error.message}`);
  }
};

// 掃描付款地址功能實作
const scanPaymentAddress = async () => {
  openQrScanner();
};

// 開啟 QR Scanner
const openQrScanner = () => {
  const qrScannerModal = document.getElementById("qr-scanner-modal");
  qrScannerModal.style.display = "flex";

  const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    // 停止掃描並清理
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      qrScannerModal.style.display = "none";
      // 將掃描到的地址填入付款地址欄位
      document.getElementById("payment-address").value = decodedText;
    }).catch(err => {
      console.error("停止掃描失敗：", err);
    });
  };

  const qrCodeErrorCallback = (errorMessage) => {
    // 可以選擇忽略錯誤或顯示提示
    // console.log(`QR Code Scan Error: ${errorMessage}`);
  };

  const qrReader = new Html5Qrcode("qr-reader");
  const config = { fps: 10, qrbox: 250 };

  Html5Qrcode.getCameras().then(cameras => {
    if (cameras && cameras.length) {
      let cameraId = cameras[0].id;
      qrReader.start(
        cameraId,
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      ).catch(err => {
        console.error(`無法啟動掃描器，錯誤：${err}`);
        alert("無法啟動掃描器，請確保授權攝像頭權限。");
        qrScannerModal.style.display = "none";
      });
    } else {
      alert("未檢測到攝像頭");
      qrScannerModal.style.display = "none";
    }
  }).catch(err => {
    console.error("獲取攝像頭失敗：", err);
    alert("無法獲取攝像頭");
    qrScannerModal.style.display = "none";
  });

  // 儲存 qrReader 實例以便關閉時使用
  window.html5QrCode = qrReader;
};

// 關閉 QR Scanner
const closeQrScanner = () => {
  const qrScannerModal = document.getElementById("qr-scanner-modal");
  qrScannerModal.style.display = "none";
  if (window.html5QrCode) {
    window.html5QrCode.stop().then(() => {
      window.html5QrCode.clear();
      window.html5QrCode = null;
    }).catch(err => {
      console.error("停止掃描失敗：", err);
    });
  }
};

// 為按鈕添加事件綁定
document.getElementById("login-button").addEventListener("click", loginWithEth);
document.getElementById("logout-button").addEventListener("click", logout);
document.getElementById("generate-receive").addEventListener("click", generateReceiveAddress);
document.getElementById("confirm-payment").addEventListener("click", payWithEth);
document.getElementById("scan-address").addEventListener("click", scanPaymentAddress);

// 為關閉按鈕添加事件綁定
document.querySelector(".close-qr-scanner").addEventListener("click", closeQrScanner);
