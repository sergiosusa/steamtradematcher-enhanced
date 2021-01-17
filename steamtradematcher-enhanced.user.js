// ==UserScript==
// @name         Steam Trade Matcher Enhanced
// @namespace    https://sergiosusa.com
// @version      0.7
// @description  This script enhanced the famous steam trading cards site Steam Trade Matcher.
// @author       Sergio Susa (sergio@sergiosusa.com)
// @match        https://www.steamtradematcher.com/compare
// @match        https://www.steamtradematcher.com/tools/fullsets
// @grant        none
// ==/UserScript==

var intervalId;

(function () {
    'use strict';
    let graphicInterface = new GraphicInterface(
        new SteamTradeMatcherUtilities()
    );
    graphicInterface.render();
})();

function SteamTradeMatcherUtilities() {

    this.BOT_USER_TYPE = '(Trade bot)';
    this.STM_USER_TYPE = '(STM user)';

    this.showAll = () => {
        this.showUserByType(null);
    };

    this.showTradeBots = () => {
        this.showUserByType(this.BOT_USER_TYPE);
    };

    this.showNonTradeBots = () => {
        this.showUserByType(this.STM_USER_TYPE);
    };

    this.showUserByType = (type) => {
        document.querySelectorAll('.stm-user').forEach(function (item) {
            let userType = item.innerHTML;
            let traderNode = item.parentNode.parentNode.parentNode;

            if (userType === type || type === null) {
                traderNode.style.display = '';
            } else {
                traderNode.style.display = 'none';
            }
        });
    };

    this.orderByTradeQuantity = () => {
        let results = document.querySelectorAll('#match-results > div');
        let arrayNodes = [];

        results.forEach(function (item) {
            item.parentElement.removeChild(item);
            arrayNodes.push(item);
        });

        arrayNodes.sort(
            (a, b) => {
                let tradesA = a.querySelectorAll('.match-container').length;
                let tradesB = b.querySelectorAll('.match-container').length;

                return (tradesA < tradesB) ? ((tradesA < tradesB) ? 1 : 0) : -1;
            }
        );

        arrayNodes.forEach(function (item) {
            document.querySelector('#match-results').append(item);
        });
    };
}

function GraphicInterface(steamTradeMatcherUtilities) {

    this.steamTradeMatcherUtilities = steamTradeMatcherUtilities;

    this.render = () => {

        if (this.isFullSetsPage()) {
            this.renderFullSetsPageGadget();
        }

        if (this.isComparePage()) {
            this.renderComparePageGadget();
        }
    };

    this.renderFullSetsPageGadget = () => {
        intervalId = setInterval(function (self) {
            if (document.querySelector("#fullsets-calculator-progress").style.display === 'none') {
                document.querySelectorAll(".app-image-container").forEach(function (element) {
                    let steamAppId = element.querySelector(".badge-link a").getAttribute('href').match(/https:\/\/steamcommunity\.com\/my\/gamecards\/(\d+)\//i)[1];
                    element.innerHTML = element.innerHTML + self.fullSetsPageTemplate(steamAppId);
                });
                clearInterval(intervalId);
            }

        }, 1000, this);
    };

    this.fullSetsPageTemplate = (steamAppId) => {

        return '<div class="badge-link center-block">' +
            '<a target="_blank" href="https://www.steamcardexchange.net/index.php?inventorygame-appid-' + steamAppId + '">' +
            '<img src="https://www.steamcardexchange.net/include/design/img/navbar-logo.png" alt="Steam Card Exchange inventory link"/>' +
            '</a>' +
            '</div>';

    };

    this.renderComparePageGadget = () => {
        let progressDiv = document.getElementById('progress-div');
        let newElement = document.createElement('div');
        newElement.innerHTML = this.comparePageTemplate();
        this.insertBefore(newElement, progressDiv);

        let showTradeBotsBtn = document.getElementById('show-trade-bots-btn');
        showTradeBotsBtn.onclick = () => {
            this.steamTradeMatcherUtilities.showTradeBots();
            return false;
        };

        let showNonTradeBotsBtn = document.getElementById('show-non-trade-bots-btn');
        showNonTradeBotsBtn.onclick = () => {
            this.steamTradeMatcherUtilities.showNonTradeBots();
            return false;
        };

        let showAllBtn = document.getElementById('show-all-btn');
        showAllBtn.onclick = () => {
            this.steamTradeMatcherUtilities.showAll();
            return false;
        };

        let orderByBtn = document.getElementById('order-by-trade-quantity-btn');
        orderByBtn.onclick = () => {
            this.steamTradeMatcherUtilities.orderByTradeQuantity();
            return false;
        };
    };

    this.comparePageTemplate = () => {
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
            '<div style="text-align:center;margin-bottom: 10px;" > Created by <a href="https://sergiosusa.com" target="_blank">Sergio Susa</a> and powered by <a href="https://sergiosusa.com" target="_blank">Experto de Steam</a>' +
            '</div>' +
            '</div>';
    };

    this.isFullSetsPage = () => {
        return window.location.href.includes('/tools/fullsets');
    };

    this.isComparePage = () => {
        return window.location.href.includes('/compare');
    };

    this.insertBefore = (newNode, referenceNode) => {
        referenceNode.parentNode.insertBefore(newNode, referenceNode);
    };

    this.insertAfter = (newNode, referenceNode) => {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }
}
