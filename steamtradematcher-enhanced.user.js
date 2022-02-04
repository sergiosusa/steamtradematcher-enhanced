// ==UserScript==
// @name         Steam Trade Matcher Enhanced
// @namespace    https://sergiosusa.com
// @version      2.1
// @description  This script enhanced the famous steam trading cards site Steam Trade Matcher.
// @author       Sergio Susa (sergio@sergiosusa.com)
// @match        https://www.steamtradematcher.com/compare
// @match        https://www.steamtradematcher.com/tools/fullsets
// @match        https://www.steamtradematcher.com/tools
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    try {
        reloadWhenThereIsTooMuchLoadOnServer();
        let steamTradeMatcher = new SteamTradeMatcher();
        steamTradeMatcher.render();
    } catch (exception) {
        alert(exception);
    }
})();

function SteamTradeMatcher() {

    this.rendererList = [
        new FilterScanResults(),
        new FullSetsResultAnalyzer(),
        new ToolsExtraLink()
    ];

    this.render = () => {
        let renderer = this.findRenderer();
        renderer.render();
    };

    this.findRenderer = () => {
        return this.rendererList.find(renderer => renderer.canHandleCurrentPage());
    };
}

function Renderer() {
    this.handlePage = "";

    this.canHandleCurrentPage = () => {
        return document.location.href.includes(this.handlePage);
    };
}

function FilterScanResults() {
    Renderer.call(this);
    this.handlePage = "https://www.steamtradematcher.com/compare";

    this.USER_TYPE = {
        BOT: "(Trade bot)",
        STM: "(STM user)"
    };

    this.intervalId = null;

    this.render = () => {

        this.sendHistoricalProfileComparison();

        let progressBarDiv = document.getElementById("progress-div");
        let newElement = document.createElement("div");
        newElement.innerHTML = this.filterTemplate();
        this.insertBefore(newElement, progressBarDiv);

        document.querySelector("#show-trade-bots-btn").onclick = () => {
            this.showTradeBots();
            return false;
        };

        document.querySelector("#show-non-trade-bots-btn").onclick = () => {
            this.showNonTradeBots();
            return false;
        };

        document.querySelector("#show-all-btn").onclick = () => {
            this.showAll();
            return false;
        };

        document.querySelector("#order-by-trade-quantity-btn").onclick = () => {
            this.orderByTradeQuantity();
            return false;
        };
    }

    this.showAll = () => {
        this.showUserByType();
    };

    this.showTradeBots = () => {
        this.showUserByType(this.USER_TYPE.BOT);
    };

    this.showNonTradeBots = () => {
        this.showUserByType(this.USER_TYPE.STM);
    };

    this.orderByTradeQuantity = () => {

        let traders = [];

        document.querySelectorAll("#match-results > div.match-box").forEach((trader) => {
            trader.parentElement.removeChild(trader);
            traders.push(trader);
        });

        traders.sort(
            (a, b) => {
                let countTradesA = a.querySelectorAll(".match-container").length;
                let countTradesB = b.querySelectorAll(".match-container").length;
                return (countTradesA < countTradesB) ? ((countTradesA < countTradesB) ? 1 : 0) : -1;
            }
        );

        traders.forEach((trader) => {
            document.querySelector('#match-results').append(trader);
        });
    };

    this.showUserByType = (type) => {

        document.querySelectorAll("#match-results > div.match-box").forEach((trader) => {
            let userType = trader.querySelector(".stm-user").innerText;

            if (userType === type || type === undefined) {
                trader.style.display = "";
            } else {
                trader.style.display = "none";
            }
        });
    };

    this.filterTemplate = () => {
        return '<div class="panel panel-default" id="utilities-div">' +
            '<div class="panel-heading">' +
            '<h3 class="panel-title">Filter Results</h3>' +
            '</div>' +
            '<div class="panel-body" style="display:flex;flex-wrap: wrap;justify-content: center;">' +
            '<div id="show-trade-bots-btn" class="trade-button" style="margin-right: 5px;margin-left: 5px;">Only Trade Bots</div>' +
            '<div id="show-non-trade-bots-btn" class="trade-button" style="margin-right: 5px;margin-left: 5px;">Not Trade Bots</div>' +
            '<div id="show-all-btn" class="trade-button" style="margin-right: 5px;margin-left: 5px;">All</div>' +
            '<div id="order-by-trade-quantity-btn" class="trade-button" style="margin-right: 5px;margin-left: 5px;">Order by trades quantity</div>' +
            '</div>' +
            '<div style="text-align:center;margin-bottom: 10px;" > Created by <a href="https://sergiosusa.com" target="_blank">Sergio Susa</a> and powered by <a href="https://expertodesteam.com" target="_blank">Experto de Steam</a>' +
            '</div>' +
            '</div>';
    };

    this.sendHistoricalProfileComparison = () => {
        this.historicalProfiles = localStorage.getItem("historical-profiles");

        if (null !== this.historicalProfiles) {
            this.historicalProfiles = JSON.parse(this.historicalProfiles)
        } else {
            this.historicalProfiles = publicProfiles;
            localStorage.setItem("historical-profiles", JSON.stringify(this.historicalProfiles));
        }

        for (let index = 0; index < publicProfiles.length; index++) {
            const profile = publicProfiles[index];
            this.removeItem(this.historicalProfiles, profile);
        }

        this.intervalId = setInterval((() => {
            let bundle = this.historicalProfiles.splice(0, 10);

            $('body').queue(function () {
                compareInventories(bundle, 'public');
            });

            if (this.historicalProfiles.length === 0) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }

        }).bind(this), 2000);

        let newHistoricalProfiles = JSON.parse(localStorage.getItem('historical-profiles')).concat(publicProfiles);
        newHistoricalProfiles = this.removeRepeated(newHistoricalProfiles);
        localStorage.setItem('historical-profiles', JSON.stringify(newHistoricalProfiles));
    };

    this.removeRepeated = (array) => {
        let result = new Set(array);
        return [...result];
    }

    this.removeItem = (historicalProfiles, profile) => {
        let index = historicalProfiles.indexOf(profile);
        if (index > -1) {
            historicalProfiles.splice(index, 1);
        }
    };

    this.insertBefore = (newNode, referenceNode) => {
        referenceNode.parentNode.insertBefore(newNode, referenceNode);
    };
}

FilterScanResults.prototype = Object.create(Renderer.prototype);

function FullSetsResultAnalyzer() {
    Renderer.call(this);
    this.handlePage = "https://www.steamtradematcher.com/tools/fullsets";
    this.intervalId = null;

    this.render = () => {
        this.intervalId = setInterval((() => {
            if (document.querySelector("#fullsets-calculator-progress").style.display === 'none') {
                this.injectSteamCardExchangeGameLink();
                this.printBadgeAnalysis();
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }).bind(this), 1000);
    }

    this.injectSteamCardExchangeGameLink = () => {
        document.querySelectorAll(".app-image-container").forEach(((gameCard) => {
            let steamAppId = gameCard.querySelector(".badge-link a").getAttribute('href').match(/https:\/\/steamcommunity\.com\/my\/gamecards\/(\d+)\//i)[1];
            gameCard.innerHTML = gameCard.innerHTML + this.steamCardExchangeGameLinkTemplate(steamAppId);
        }).bind(this));
    };

    this.steamCardExchangeGameLinkTemplate = (steamAppId) => {
        return '<div class="badge-link center-block">' +
            '<a target="_blank" href="https://www.steamcardexchange.net/index.php?inventorygame-appid-' + steamAppId + '">' +
            '<img src="https://www.steamcardexchange.net/include/design/img/navbar-logo.png" alt="Steam Card Exchange inventory link"/>' +
            '</a>' +
            '</div>';
    };

    this.printBadgeAnalysis = () => {

        let gameCards = document.querySelector(".fullset-calc-results").querySelectorAll(".app-image-container");

        let creatableBadges = 0;
        let notCreatableBadges = 0;

        gameCards.forEach((gameCard) => {

            let completeBadges = parseInt(gameCard.querySelector('.thumbnail-count').innerText);
            let currentBadgeLevel = parseInt(gameCard.querySelector('.badge-link').innerText.replace('Current badge level: ', ''));

            let unavailableCreatableBadges = (currentBadgeLevel + completeBadges) - 5;

            if (unavailableCreatableBadges < 0) {
                unavailableCreatableBadges = 0;
            }

            let availableCreatableBadges = 5 - currentBadgeLevel;

            if (availableCreatableBadges >= completeBadges) {
                availableCreatableBadges = completeBadges;
            }

            gameCard.style.border = '1px solid transparent';

            if (unavailableCreatableBadges > 0 && availableCreatableBadges === 0) {
                gameCard.style.border = '1px solid red';
            }

            if (unavailableCreatableBadges > 0 && availableCreatableBadges > 0) {
                gameCard.style.border = '1px solid green';
            }
            notCreatableBadges += unavailableCreatableBadges;
            creatableBadges += availableCreatableBadges;

        });

        document.querySelector('.well').innerText = document.querySelector('.well').innerText +
            ' (' + creatableBadges + ' craftables for this account and ' + notCreatableBadges + ' not)';
    };
}

FullSetsResultAnalyzer.prototype = Object.create(Renderer.prototype);


function ToolsExtraLink() {
    Renderer.call(this);
    this.handlePage = "https://www.steamtradematcher.com/tools";

    this.render = () => {
        document.querySelector('#content > div.container-fluid > div:nth-child(2) > div:nth-child(3)').innerHTML =
            '<a target="_blank" href="https://expertodesteam.com" style="text-decoration:none;">' +
            '<div class="tool-div well">' +
            '<div class="tool-div-title"><span class="glyphicon glyphicon-fire"></span> Experto de Steam</div>' +
            '<div class="tool-div-desc">Quieres conocer todos los secretos y herramientas para steam? Este es tu lugar.' +
            '</div>' +
            '</div>' +
            '</a>';
    }
}

ToolsExtraLink.prototype = Object.create(Renderer.prototype);

function reloadWhenThereIsTooMuchLoadOnServer() {
    if (document.body.innerText === 'Sorry, there is too much load on the server at the moment. Please retry later.') {
        setTimeout(function () {
            location.reload();
        }, 3000);
    }
}