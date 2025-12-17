// --- STATE VARIABLES ---
let coins = parseFloat(localStorage.getItem('userCoins')) || 10000;
let activeBet = null;      // The bet currently being typed in the slip
let lastPlacedBet = null;  // The bet that was just placed (saved for simulation)
let currentFilter = 'ALL'; 

// --- LOAD FIXTURE DATA ---
let fixturesData = JSON.parse(localStorage.getItem('fixturesData'));
if(!fixturesData) {
    fixturesData = [
      { id: 1, day: "TODAY", sport:"CRICKET", match:"India vs South Africa", time:"7:00 PM", back:1.85, lay:1.90 },
      { id: 2, day: "TODAY", sport:"FOOTBALL", match:"Barcelona vs Real Madrid", time:"9:30 PM", back:2.10, lay:2.20 },
      { id: 3, day: "TOMORROW", sport:"TENNIS", match:"Djokovic vs Alcaraz", time:"4:15 PM", back:1.55, lay:1.60 },
      { id: 4, day: "TODAY", sport:"BASKETBALL", match:"Lakers vs Warriors", time:"11:00 PM", back:1.92, lay:1.98 },
      { id: 5, day: "TODAY", sport:"CRICKET", match:"Sri Lanka vs Bangladesh", time:"2:30 PM", back:2.00, lay:2.10 }
    ];
    localStorage.setItem('fixturesData', JSON.stringify(fixturesData));
}

// --- NOTIFICATION SYSTEM ---
function showNotification(message, type) {
  const container = document.getElementById("notification-area");
  if(!container) return; // Safety check
  
  const toast = document.createElement("div");
  toast.className = `toast-msg ${type}`;
  let icon = type === 'success' ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>';
  toast.innerHTML = `${icon} <b>${message}</b>`;
  
  container.appendChild(toast);

  // Auto remove after 3.5s
  setTimeout(() => {
    toast.style.animation = "fadeOut 0.5s forwards";
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}

// --- FILTER & RENDER LOGIC ---
function filterSports(sportType, element) {
    currentFilter = sportType;
    // Update Tabs
    const tabs = document.querySelectorAll('.nav-link');
    tabs.forEach(t => t.classList.remove('active'));
    element.classList.add('active');

    // Switch View
    if(sportType === 'LUCKY10') {
        renderLuckyGame();
    } else {
        renderFixtures();
    }
}

function renderFixtures(){
  const container = document.getElementById("fixtures");
  container.innerHTML = "";
  
  // Refresh data from storage
  const storedData = JSON.parse(localStorage.getItem('fixturesData'));
  if(storedData) fixturesData = storedData;

  const days = ["TODAY","TOMORROW","DAY AFTER"];

  days.forEach(day=>{
    let dayMatches = fixturesData.filter(f => f.day === day);
    if(currentFilter !== 'ALL') {
        dayMatches = dayMatches.filter(f => f.sport === currentFilter);
    }
    
    if(dayMatches.length > 0){
        container.innerHTML += `<h5 class="section-title">${day}</h5>`;
        dayMatches.forEach(m => {
             let sportColor = "#6c757d";
             if(m.sport === "CRICKET") sportColor = "#1e3c72";
             if(m.sport === "FOOTBALL") sportColor = "#198754";
             if(m.sport === "TENNIS") sportColor = "#d35400";
             if(m.sport === "BASKETBALL") sportColor = "#c0392b";

             container.innerHTML += `
            <div class="fixture" style="border-left: 5px solid ${sportColor}">
              <div class="fixture-info">
                <b>${m.match}</b><br>
                <small style="color:${sportColor}; font-weight:700;">${m.sport}</small> 
                <small class="text-muted">• ${m.time}</small>
              </div>
              <div class="odds">
                <button class="back" onclick="openBet('${m.match}','BACK',${m.back})">
                    <span style="font-size:10px; opacity:0.7;">BACK</span>
                    ${m.back}
                </button>
                <button class="lay" onclick="openBet('${m.match}','LAY',${m.lay})">
                    <span style="font-size:10px; opacity:0.7;">LAY</span>
                    ${m.lay}
                </button>
              </div>
            </div>`;
        });
    }
  });
  
  if(container.innerHTML === "") {
     container.innerHTML = `<div class="text-center mt-5 text-muted">No matches found for ${currentFilter}</div>`;
  }
}

function renderLuckyGame() {
    const container = document.getElementById("fixtures");
    container.innerHTML = `
        <div class="text-center mb-4">
            <h3><i class="fa-solid fa-gem text-warning"></i> Lucky 10 Number Game</h3>
            <p class="text-muted">Pick a number (1-10). Win <b>10x</b> returns!</p>
        </div>
        <div class="row g-3 justify-content-center" id="lucky-grid"></div>
    `;

    const grid = document.getElementById("lucky-grid");
    for(let i=1; i<=10; i++) {
        grid.innerHTML += `
            <div class="col-4 col-md-2">
                <button class="btn w-100 py-4 fw-bold shadow-sm" 
                    style="background: white; border: 2px solid #ddd; font-size: 1.5rem; color: #333;"
                    onmouseover="this.style.borderColor='#ffc107'"
                    onmouseout="this.style.borderColor='#ddd'"
                    onclick="openLuckyBet(${i})">
                    ${i}
                </button>
            </div>
        `;
    }
}

function updateCoins(){
  document.getElementById("coins").innerText = coins.toFixed(2);
  localStorage.setItem('userCoins', coins);
}

// --- BET SLIP MANAGEMENT ---
function openBet(match, type, odds){
  activeBet = { type: 'SPORT', match, betType: type, odds, stake:0 };
  
  document.getElementById("betTitle").innerText = match;
  document.getElementById("betTypeTag").innerText = type;
  document.getElementById("betTypeTag").style.color = type === "BACK" ? "#004a7c" : "#7c0000";
  document.getElementById("betOdds").innerText = odds;
  
  resetSlipUI();
  showSlip();
}

function openLuckyBet(number) {
    activeBet = { type: 'LUCKY', number: number, odds: 10, stake: 0 };
    
    document.getElementById("betTitle").innerText = `Lucky Number ${number}`;
    document.getElementById("betTypeTag").innerText = "JACKPOT";
    document.getElementById("betTypeTag").style.color = "#d35400";
    document.getElementById("betOdds").innerText = "10.0";
    
    resetSlipUI();
    showSlip();
}

function resetSlipUI() {
    document.getElementById("stake").value = "";
    document.getElementById("profitInfo").innerText = "";
}

function showSlip() {
    document.getElementById("betslip").style.display = "block";
    document.getElementById("betslipOverlay").style.display = "block";
}

function closeSlip(){
  document.getElementById("betslip").style.display = "none";
  document.getElementById("betslipOverlay").style.display = "none";
  activeBet = null; // Clear active bet when closed manually
}

// --- PROFIT/LOSS CALCULATOR ---
document.getElementById("stake").addEventListener("input", function(){
  if(!activeBet) return;
  const stake = Number(this.value);
  activeBet.stake = stake;

  if(stake <= 0){
    document.getElementById("profitInfo").innerText = "";
    return;
  }
  
  let profit = 0;
  let purse = 0; // Simulated purse AFTER win

  if(activeBet.type === 'LUCKY') {
      profit = stake * 9; // 10x return means 9x profit + stake back
      purse = coins + profit; 
  } else if(activeBet.betType === 'BACK') {
      profit = (activeBet.odds - 1) * stake;
      purse = coins + profit;
  } else {
      // Lay Logic
      const liability = (activeBet.odds - 1) * stake;
      purse = coins + stake; // If you win a LAY bet (as a bookie), you keep the stake
      document.getElementById("profitInfo").innerHTML = 
      `Liability: <span class="text-danger">${liability.toFixed(2)}</span><br>
       <small class="text-muted">Purse after Win: <b>${purse.toFixed(2)}</b></small>`;
      return;
  }

  document.getElementById("profitInfo").innerHTML = 
      `Profit: <span class="text-success">${profit.toFixed(2)}</span><br>
       <small class="text-muted">Purse after Win: <b>${purse.toFixed(2)}</b></small>`;
});

// --- PLACE BET (MONEY DEDUCTED HERE) ---
function placeBet(){
  if(!activeBet || activeBet.stake <= 0) {
      showNotification("Invalid stake", "error"); return;
  }
  if(activeBet.stake > coins) {
      showNotification("Insufficient coins", "error"); return;
  }

  // 1. SAVE THIS BET for the Simulation buttons
  lastPlacedBet = { ...activeBet }; 

  // 2. DEDUCT MONEY NOW
  coins -= activeBet.stake;
  updateCoins();

  // 3. LOGIC FOR DIFFERENT GAMES
  if(activeBet.type === 'LUCKY') {
      // Register for Admin Panel
      let luckyBets = JSON.parse(localStorage.getItem('luckyBets')) || [];
      luckyBets.push({
          number: activeBet.number,
          stake: activeBet.stake,
          status: 'PENDING',
          timestamp: Date.now()
      });
      localStorage.setItem('luckyBets', JSON.stringify(luckyBets));
      showNotification(`Bet Placed on Number ${activeBet.number}`, "success");
  } else {
      showNotification(`Bet Placed on ${activeBet.match}`, "success");
  }
  
  closeSlip();
}

// --- SIMULATION BUTTONS (ADMIN CONTROLS) ---

function settleWin() {
    // Check if we have a bet to settle (either open or just placed)
    let betToSettle = activeBet || lastPlacedBet;

    if(!betToSettle) { 
        showNotification("Place a bet first to simulate!", "error"); 
        return; 
    }

    let winAmount = 0;

    // Calculate Winning Amount based on Type
    if(betToSettle.type === 'LUCKY') {
        winAmount = betToSettle.stake * 10; // 10x Jackpot
    } else if(betToSettle.betType === "BACK"){
        winAmount = betToSettle.stake * betToSettle.odds; // Standard Back
    } else {
        winAmount = betToSettle.stake * 2; // Demo Lay Win (Double Stake)
    }

    // ADD WINNINGS TO WALLET
    coins += winAmount;
    updateCoins();

    // Show Profit Message
    const profit = winAmount - betToSettle.stake;
    showNotification(`YOU WON! (+${profit.toFixed(2)} coins)`, "success");
    
    // Cleanup
    lastPlacedBet = null; 
    closeSlip();
}

function settleLoss(){
    let betToSettle = activeBet || lastPlacedBet;

    if(!betToSettle) { 
        showNotification("Place a bet first to simulate!", "error"); 
        return; 
    }
    
    // Money was ALREADY deducted in 'placeBet'.
    // We just show the notification that it is gone forever.
    showNotification(`YOU LOST! (-${betToSettle.stake.toFixed(2)} coins)`, "error");
    
    // Cleanup
    lastPlacedBet = null;
    closeSlip();
}

// --- LISTENER FOR ADMIN PANEL RESULTS ---
window.addEventListener('storage', (e) => {
    // Listen for Lucky 10 Results from Admin
    if(e.key === 'luckyResult') {
        const result = JSON.parse(e.newValue);
        if(!result) return;

        let luckyBets = JSON.parse(localStorage.getItem('luckyBets')) || [];
        let winningAmount = 0;
        let didWin = false;
        
        // Check all pending bets
        luckyBets = luckyBets.filter(bet => {
            if(bet.status === 'PENDING') {
                if(bet.number === result.winner) {
                    winningAmount += bet.stake * 10;
                    didWin = true;
                    return false; // Remove processed bet
                }
                return false; // Remove losing bets
            }
            return true;
        });
        
        localStorage.setItem('luckyBets', JSON.stringify(luckyBets));

        if(didWin) {
            coins += winningAmount;
            updateCoins();
            showNotification(`🎉 JACKPOT! Number ${result.winner} Won! (+${winningAmount})`, "success");
        } else {
            showNotification(`Number ${result.winner} came. Better luck next time!`, "error");
        }
    }
    
    // Sync Coins if Admin edited balance
    if(e.key === 'userCoins') {
        coins = parseFloat(e.newValue);
        updateCoins();
    }
});

// --- INITIALIZATION ---
updateCoins();
renderFixtures();