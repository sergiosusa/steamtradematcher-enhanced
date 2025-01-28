// ==UserScript==
// @name         Steam Trade Matcher Enhanced
// @namespace    https://sergiosusa.com
// @version      3.12
// @description  This script enhanced the famous steam trading cards site Steam Trade Matcher.
// @icon         https://www.google.com/s2/favicons?sz=64&domain=steamtradematcher.com
// @author       Sergio Susa (sergio@sergiosusa.com)
// @match        https://www.steamtradematcher.com/matcher
// @match        https://www.steamtradematcher.com/tools/fullsets
// @match        https://www.steamtradematcher.com/tools
// @match        https://www.steamtradematcher.com/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js
// @homepageURL  https://github.com/sergiosusa/steamtradematcher-enhanced
// @supportURL   https://github.com/sergiosusa/steamtradematcher-enhanced/issues
// @downloadURL  https://github.com/sergiosusa/steamtradematcher-enhanced/raw/refs/heads/main/steamtradematcher-enhanced.user.js
// @updateURL    https://github.com/sergiosusa/steamtradematcher-enhanced/raw/refs/heads/main/steamtradematcher-enhanced.user.js
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
        new ScanResultConfigurator(),
        new FullSetsResultAnalyzer(),
        new ToolsExtraLink()
    ];

    this.render = () => {
        let renderers = this.findRenderers();

        for (const renderer of renderers) {
            renderer.render();
        }
    };

    this.findRenderers = () => {
        let renderers = [];

        for (const renderer of this.rendererList) {
            if (renderer.canHandleCurrentPage()) {
                renderers.push(renderer);
            }
        }
        return renderers;
    };
}

function Renderer() {
    this.handlePage = "";

    this.canHandleCurrentPage = () => {
        return null !== document.location.href.match(this.handlePage);
    };
}

function ScanResultConfigurator() {
    Renderer.call(this);

    this.handlePage = /https:\/\/www.steamtradematcher\.com\/matcher/g;
    this.intervalId = null;

    this.render = () => {
        this.intervalId = setInterval((() => {

            let temporaryCalculationText = document.querySelector("#results-status").innerText.trim();
            if (temporaryCalculationText !== 'Calculating... Please wait...' && !temporaryCalculationText.includes("queue")) {

                if (document.querySelectorAll("i.fa-arrow-right-arrow-left").length === 0) {
                    return;
                }

                document.querySelectorAll("i.fa-arrow-right-arrow-left").forEach((element, index) => {
                    let dataAppId = element.closest("div[data-application-id]").getAttribute("data-application-id");
                    let dataUserId = element.closest("div[data-steamid]").getAttribute("data-steamid");
                    element.innerHTML = '<input type="checkbox" id="trade_box_' + dataUserId + "-" + dataAppId + '" value="' + dataUserId + "-" + dataAppId + '" />';
                });

                document.querySelectorAll("input[id^='trade_box_']").forEach((element) => {
                    element.addEventListener('change', ((event) => {
                        this.updateTradeLink(event.target.closest("div.card-body"));
                    }).bind(this));
                });

                this.createCardSelectionInteraction();

                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }).bind(this), 1000);
    }

    this.updateTradeLink = (tradeContainer) => {
        let selectedTrades = tradeContainer.querySelectorAll("input[id^='trade_box_']:checked");
        let tradeLink = tradeContainer.closest("div.user-results.card").querySelector("a[href*='/tradeOffer']");

        if (selectedTrades.length === 0) {
            tradeLink.href = tradeLink.getAttribute("originalHref");
            tradeLink.removeAttribute("originalHref");
        } else {
            if (!tradeLink.getAttribute("originalHref")) {
                tradeLink.setAttribute("originalHref", tradeLink.href);
            }

            let queryArrayString = [];

            for (const selectedCheck of selectedTrades) {

                let cardGroupContainer = selectedCheck.closest("div.results-item");
                let cardYourItemsContainer = cardGroupContainer.querySelector("div.items-yours");
                let cardTheirItemsContainer = cardGroupContainer.querySelector("div.items-theirs");

                if (!this.isAnyCardMarked(cardYourItemsContainer)) {
                    this.markFirstCard(cardYourItemsContainer);
                }

                if (!this.isAnyCardMarked(cardTheirItemsContainer)) {
                    this.markFirstCard(cardTheirItemsContainer);
                }

                let yourSelectedCard = this.findSelectedCard(cardYourItemsContainer);
                let theirSelectedCard = this.findSelectedCard(cardTheirItemsContainer);

                queryArrayString.push("you[]=" + yourSelectedCard.getAttribute("data-classid"));
                queryArrayString.push("them[]=" + theirSelectedCard.getAttribute("data-classid"));
            }

            let basePath = tradeLink.href.split('?')[0];
            tradeLink.href = basePath + "?" + queryArrayString.join("&");
        }
    }

    this.createCardSelectionInteraction = () => {
        this.fixIncorrectYoursItemsCardCcsClass();

        document.querySelectorAll("div[data-classid]").forEach(((element) => {
            element.addEventListener('click', ((event) => {
                let selectedCard = event.target.parentElement;
                this.markOnlySelectedCard(selectedCard);

                if (this.cardGroupSelected(selectedCard)) {
                    this.updateTradeLink(event.target.closest("div.card-body"));
                }

            }).bind(this));
        }).bind(this));

    }

    this.findSelectedCard = (cardContainer) => {
        return cardContainer.querySelector("div[selected='true']");
    };

    this.cardGroupSelected = (selectedCard) => {
        return null !== selectedCard.closest("div.results-item").querySelector("input[id^='trade_box_']:checked");
    }

    this.isAnyCardMarked = (cardContainer) => {
        return null !== cardContainer.querySelector("div[selected='true']");
    }

    this.markFirstCard = (cardContainer) => {
        this.markCard(cardContainer.querySelector("div[data-classid]"));
    }

    this.markOnlySelectedCard = (selectedCard) => {
        let cardGroup = selectedCard.closest("div.items-yours, div.items-theirs");
        let listOfCards = cardGroup.querySelectorAll("div[data-classid]");

        listOfCards.forEach((card) => {
            this.unmarkCard(card);
        });

        this.markCard(selectedCard);
    }

    this.fixIncorrectYoursItemsCardCcsClass = () => {
        document.querySelectorAll(".items-yours").forEach((element) => {
            element.classList.remove("items-yours");
            element.parentElement.classList.add("items-yours");
        });
    }

    this.markCard = (cardContainer) => {
        cardContainer.style.border = "red thin dashed";
        cardContainer.setAttribute("selected", true);
    }

    this.unmarkCard = (cardContainer) => {
        cardContainer.style.border = "none";
        cardContainer.removeAttribute("selected");
    }
}

ScanResultConfigurator.prototype = Object.create(Renderer.prototype);


function FilterScanResults() {
    Renderer.call(this);
    this.handlePage = /https:\/\/www.steamtradematcher\.com\/matcher/g;
    this.intervalId = null;

    this.USER_TYPE = {
        BOT: "BOT",
        USER: "USER",
        ALL: "ALL"
    };

    this.render = () => {

        this.intervalId = setInterval((() => {
            let temporaryCalculationText = document.querySelector("#results-status").innerText.trim();
            if (temporaryCalculationText !== 'Calculating... Please wait...' && !temporaryCalculationText.includes("queue")) {

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

            let temporaryCalculationText = document.querySelector("#results").innerText.trim();
            if (temporaryCalculationText !== 'Calculating... Please wait...' && !temporaryCalculationText.includes("queue")) {
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
            '<img class="steamTrade" src="https://www.steamcardexchange.net/static/img/navbar-logo.svg" alt="Steam Card Exchange inventory link"/>' +
            '</a>' +
            '</div>';
    };

    this.printBadgeAnalysis = () => {
        document.querySelector(".big-title").innerHTML += this.badgeAnalysisTemplate(this.calculateGameListOrderByBadgesReady(10))
        this.initializeChart(this.calculateBadgesSummary());
    };

    this.badgeAnalysisTemplate = (badgesList) => {
        let gameTopTemplate = "";

        badgesList.forEach((game) => {
            gameTopTemplate += '<div style="width:70%;">' + game.name + '</div><div style="width:30%;">' + game.quantity + '</div>';
        });

        return '<div style="padding-top: 10px;padding-left: 10px; " class="card border-dark">' +
            '<h4>Analysis Results</h4>' +
            '<div style="display: flex;flex-direction: row;margin-bottom: 10px;justify-content: space-around;">' +
            '<div width="400" height="400"><canvas id="badgesResume" ></canvas></div>' +
            '<div style="display: flex;flex-direction: column;width: 50%;">' +
            '<h5>Top 10</h5>' +
            '<div style="display:flex;flex-direction:row;justify-content: space-between;flex-wrap:wrap;">' +
            gameTopTemplate +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
    };

    this.calculateBadgesSummary = () => {

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

        return {
            completable: this.calculateCompletableBadges(),
            crafteable: creatableBadges,
            uncraftable: notCreatableBadges
        };
    };

    this.initializeChart = (badgesSummary) => {
        const ctx = document.getElementById('badgesResume').getContext('2d');
        const myChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: [
                    'Crafteables',
                    'Repeated',
                    'Completable'
                ],
                datasets: [
                    {
                        label: "Ready Badges Status",
                        data: [badgesSummary.crafteable, badgesSummary.uncraftable, badgesSummary.completable],
                        backgroundColor: [
                            'rgb(52, 187, 82)',
                            'rgb(187,52,52)',
                            'rgb(52,74,187)'
                        ],
                        hoverOffset: 4
                    }
                ]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                            color: "white",
                            size: 18
                        }
                    }
                }
            }
        });
    };

    this.calculateCompletableBadges = () => {
        let completableBadges = 0;

        document.querySelectorAll("img.steamTrade").forEach((element) => {
            completableBadges += parseInt(element.closest(".item.card").querySelector("div").innerText);
        });

        return completableBadges;
    }

    this.calculateGameListOrderByBadgesReady = (limit = null) => {
        let list = [];

        document.querySelector("#results div.border-dark").querySelectorAll(".item .count").forEach((gameCounter) => {
            let current = parseInt(gameCounter.innerText);
            list.push({
                name: gameCounter.closest(".item").querySelector(".card-title").innerText,
                quantity: current
            });
        });

        let orderList = list.sort((game1, game2) => {
            if (game1.quantity < game2.quantity) {
                return 1;
            } else {
                return -1;
            }
        });

        if (limit !== null) {
            orderList = orderList.slice(0, limit);
        }

        return orderList;
    };
}

FullSetsResultAnalyzer.prototype = Object.create(Renderer.prototype);

function ToolsExtraLink() {
    Renderer.call(this);

    this.handlePage = /https:\/\/www.steamtradematcher\.com\/tools$/g;

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
