// ==UserScript==
// @name         Steam Trade Matcher Enhanced
// @namespace    https://sergiosusa.com
// @version      3.2
// @description  This script enhanced the famous steam trading cards site Steam Trade Matcher.
// @author       Sergio Susa (sergio@sergiosusa.com)
// @match        https://www.steamtradematcher.com/matcher
// @match        https://www.steamtradematcher.com/tools/fullsets
// @match        https://www.steamtradematcher.com/tools
// @match        https://www.steamtradematcher.com/*
// @grant        none
// ==/UserScript==

var currentPage = window.location.pathname;

(function () {
    'use strict';
    try {
        let steamTradeMatcher = new SteamTradeMatcher();
        steamTradeMatcher.render();

        setInterval(function () {
            if (currentPage !== window.location.pathname) {
                currentPage = window.location.pathname;
                steamTradeMatcher.render();
            }

        }.bind(this), 1000);

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

        if (renderer !== undefined) {
            renderer.render();
        }
    };

    this.findRenderer = () => {
        return this.rendererList.find(renderer => renderer.canHandleCurrentPage());
    };
}

function Renderer() {
    this.handlePage = "";

    this.canHandleCurrentPage = () => {
        return null !== document.location.href.match(this.handlePage);
    };
}

function FilterScanResults() {
    Renderer.call(this);
    this.handlePage = /https:\/\/www.steamtradematcher\.com\/matcher/g;
    this.intervalId = null;

    this.USER_TYPE = {
        BOT: "BOT",
        USER: "USER",
        ALL: "ALL"
    };

    this.intervalId = null;

    this.render = () => {

        this.intervalId = setInterval((() => {
            if (document.querySelector("#results-status").innerText.trim() !== 'Calculating... Please wait...') {

                if (document.querySelector("#filterToolbar") !== null) {
                    return;
                }

                let resultContainer = document.querySelector("#results-status");
                let newElement = document.createElement("div");
                newElement.id = "filterToolbar";
                newElement.innerHTML = this.filterTemplate();
                this.insertBefore(newElement, resultContainer);

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

                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }).bind(this), 1000);

    }

    this.showAll = () => {
        this.showUserByType(this.USER_TYPE.ALL);
    };

    this.showTradeBots = () => {
        this.showUserByType(this.USER_TYPE.BOT);
    };

    this.showNonTradeBots = () => {
        this.showUserByType(this.USER_TYPE.USER);
    };

    this.orderByTradeQuantity = () => {

        let traders = [];

        document.querySelectorAll("#results .user-results").forEach((trader) => {
            trader.parentElement.removeChild(trader);
            traders.push(trader);
        });

        traders.sort(
            (a, b) => {
                let countTradesA = a.querySelectorAll(".applications-results > div").length;
                let countTradesB = b.querySelectorAll(".applications-results > div").length;
                return (countTradesA < countTradesB) ? ((countTradesA < countTradesB) ? 1 : 0) : -1;
            }
        );

        traders.forEach((trader) => {
            document.querySelector('#results').append(trader);
        });
    };

    this.showUserByType = (type) => {

        document.querySelectorAll("#results > div.user-results")[0].querySelector(".fa-robot")

        document.querySelectorAll("#results > div.user-results").forEach((trader) => {
            let bot = trader.querySelector(".fa-robot");

            if ((this.USER_TYPE.BOT === type && bot !== null) || (this.USER_TYPE.USER === type && bot === null) || type === this.USER_TYPE.ALL) {
                trader.style.display = "";
            } else {
                trader.style.display = "none";
            }
        });
    };

    this.filterTemplate = () => {

        return '<div style="margin-bottom: 10px;" class="user-results card flex-grow-1 shadow border border-gray-700">' +
            '<div class="card-header d-flex position-sticky shadow">' +
            '<a id="show-trade-bots-btn" title="Show trade bots only" class="btn me-2 border border-2 btn-gold border-dark text-dark" href="javascript:void(0);">' +
            '   <i class="fa-solid fa-robot"></i>' +
            '</a>' +
            '<a id="show-non-trade-bots-btn" title="Show non trade bots" class="btn me-2 border border-2 btn-gold border-dark text-dark" href="javascript:void(0);">' +
            '   <i class="fa-solid fa-user"></i>' +
            '</a>' +
            '<a id="show-all-btn" title="Show all" class="btn me-2 border border-2 btn-gold border-dark text-dark" href="javascript:void(0);">' +
            '   <i class="fa-solid fa-people-group"></i>' +
            '</a>' +
            '<a id="order-by-trade-quantity-btn" title="Order results" class="btn me-2 border border-2 btn-gold border-dark text-dark" href="javascript:void(0);">' +
            '   <i class="fa-solid fa-sort"></i>' +
            '</a>' +
            '</div>' +
            '<div style="margin: 10px">' +
            'Created by <a href="https://sergiosusa.com" target="_blank">Sergio Susa</a> and powered by <a href="https://expertodesteam.com" target="_blank">Experto de Steam</a>' +
            '</div>' +
            '</div>';
    };

    this.insertBefore = (newNode, referenceNode) => {
        referenceNode.parentNode.insertBefore(newNode, referenceNode);
    };
}

FilterScanResults.prototype = Object.create(Renderer.prototype);

function FullSetsResultAnalyzer() {
    Renderer.call(this);
    this.handlePage = /https:\/\/www.steamtradematcher\.com\/tools\/fullsets/g;
    this.intervalId = null;

    this.render = () => {
        this.intervalId = setInterval((() => {
            if (document.querySelector("#results").innerText.trim() !== 'Calculating... Please wait...') {
                this.injectSteamCardExchangeGameLink();
                this.printBadgeAnalysis();
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }).bind(this), 1000);
    }

    this.injectSteamCardExchangeGameLink = () => {
        document.querySelectorAll("#results div.border-dark:nth-child(2) div.card").forEach(((gameCard) => {
            let steamAppId = gameCard.querySelector("a").getAttribute('href').match(/https:\/\/steamcommunity\.com\/my\/gamecards\/(\d+)/i)[1];
            gameCard.innerHTML = gameCard.innerHTML + this.steamCardExchangeGameLinkTemplate(steamAppId);
        }).bind(this));
    };

    this.steamCardExchangeGameLinkTemplate = (steamAppId) => {
        return '<div style="text-align: center;" >' +
            '<a target="_blank" href="https://www.steamcardexchange.net/index.php?inventorygame-appid-' + steamAppId + '">' +
            '<img src="https://www.steamcardexchange.net/include/design/img/navbar-logo.png" alt="Steam Card Exchange inventory link"/>' +
            '</a>' +
            '</div>';
    };

    this.printBadgeAnalysis = () => {

        let gameCards = document.querySelector("#results div.border-dark").querySelectorAll(".card");

        let creatableBadges = 0;
        let notCreatableBadges = 0;

        gameCards.forEach((gameCard) => {

            let completeBadges = parseInt(gameCard.querySelector("div").innerText);
            let currentBadgeLevel = parseInt(gameCard.querySelector(".card-body div a span").innerText.replace("Current badge level: ", "").trim());

            if (isNaN(currentBadgeLevel)) {
                currentBadgeLevel = 0;
            }

            let unavailableCreatableBadges = (currentBadgeLevel + completeBadges) - 5;

            if (unavailableCreatableBadges < 0) {
                unavailableCreatableBadges = 0;
            }

            let availableCreatableBadges = 5 - currentBadgeLevel;

            if (availableCreatableBadges >= completeBadges) {
                availableCreatableBadges = completeBadges;
            }

            gameCard.style.border = '2px solid transparent';

            if (unavailableCreatableBadges > 0 && availableCreatableBadges === 0) {
                gameCard.style.border = '2px solid red';
            }

            if (unavailableCreatableBadges > 0 && availableCreatableBadges > 0) {
                gameCard.style.border = '2px solid green';
            }
            notCreatableBadges += unavailableCreatableBadges;
            creatableBadges += availableCreatableBadges;

        });

        let gameNode = this.calculateGameWithMoreBadgesReady();
        let quantityOfBadges = gameNode.querySelector(".count").innerText;
        let gameName = gameNode.querySelector(".card-title").innerText;

        document.querySelector(".big-title").innerHTML +=
            '<div style="padding-top: 10px;padding-left: 10px; " class="card border-dark">' +
            '<h4>Analysis Results</h4>' +
            '<div style="display: flex;flex-direction: column;">' +
            '<div style="margin-right: 15px;"><strong>Crafteables Badges:</strong> ' + creatableBadges + '</div>' +
            '<div style="margin-right: 15px;"><strong>Repeated Badges:</strong> ' + notCreatableBadges + '</div>' +
            '<div style="margin-right: 15px;"><strong>Game with more badges ready: </strong> ' + gameName + ' (' + quantityOfBadges + ' badges)' + '</div>' +
            '</div>' +
            '</div>';
    };

    this.calculateGameWithMoreBadgesReady = () => {
        let max = 0;
        let nodeMax = null;
        document.querySelector("#results div.border-dark").querySelectorAll(".item .count").forEach((gameCounter) => {
            let current = parseInt(gameCounter.innerText);
            if (current > max) {
                max = current;
                nodeMax = gameCounter;
            }
        });
        return nodeMax.parentNode;
    };
}

FullSetsResultAnalyzer.prototype = Object.create(Renderer.prototype);

function ToolsExtraLink() {
    Renderer.call(this);

    this.handlePage = /https:\/\/www.steamtradematcher\.com\/tools/g;

    this.render = () => {
        document.querySelector('.row').innerHTML = document.querySelector('.row').innerHTML +
            '<div class="col-lg-4 g-3">' +
            '            <a target="_blank" href="https://expertodesteam.com" class="rounded-1 p-4 btn btn-dark bg-opacity-10 bg-gradient border border-dark h-100 text-center text-decoration-none text-white d-block shadow">' +
            '                <div class="display-5 mb-3"><i class="fas fa-calculator fa-fw"></i>Experto de Steam</div>' +
            '                <div>' +
            '                    <span class="fw-light">Quieres conocer todos los secretos y herramientas para steam? Este es tu lugar.</span>' +
            '                </div>' +
            '            </a>' +
            '        </div>';
    }
}

ToolsExtraLink.prototype = Object.create(Renderer.prototype);
