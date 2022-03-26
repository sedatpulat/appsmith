import { AggregateHelper } from "./AggregateHelper";
import { CommonLocators } from "../Objects/CommonLocators";

const agHelper = new AggregateHelper();
const locator = new CommonLocators()

export class ApiPage {

    private _createapi = ".t--createBlankApiCard"
    private _resourceUrl = ".t--dataSourceField"
    private _headerKey = (index: number) => ".t--actionConfiguration\\.headers\\[0\\]\\.key\\." + index + ""
    private _headerValue = (index: number) => ".t--actionConfiguration\\.headers\\[0\\]\\.value\\." + index + ""
    private _paramKey = (index: number) => ".t--actionConfiguration\\.queryParameters\\[0\\]\\.key\\." + index + ""
    private _paramValue = (index: number) => ".t--actionConfiguration\\.queryParameters\\[0\\]\\.value\\." + index + ""
    _bodyKey = (index: number) => ".t--actionConfiguration\\.bodyFormData\\[0\\]\\.key\\." + index + ""
    _bodyValue = (index: number) => ".t--actionConfiguration\\.bodyFormData\\[0\\]\\.value\\." + index + ""
    _bodyTypeDropdown = "//span[text()='Type'][@class='bp3-button-text']/parent::button"
    private _apiRunBtn = ".t--apiFormRunBtn"
    private _queryTimeout = "//input[@name='actionConfiguration.timeoutInMillisecond']"
    _responseBody = ".CodeMirror-code  span.cm-string.cm-property"
    private _blankAPI = "span:contains('New Blank API')"
    private _apiVerbDropdown = ".t--apiFormHttpMethod"
    private _verbToSelect = (verb: string) => "//div[contains(@class, 't--dropdown-option')]//span[contains(text(),'" + verb + "')]"
    private _bodySubTab = (subTab: string) => `[data-cy='tab--${subTab}']`
    _visibleTextSpan = (spanText: string) => "//span[text()='" + spanText + "']"
    _visibleTextDiv = (divText: string) => "//div[text()='" + divText + "']"
    _noBodyMessageDiv = "#NoBodyMessageDiv"
    _noBodyMessage = "This request does not have a body"

    CreateApi(apiName: string = "") {
        cy.get(locator._createNew).click({ force: true });
        cy.get(this._blankAPI).click({ force: true });
        agHelper.ValidateNetworkStatus("@createNewApi", 201)

        // cy.get("@createNewApi").then((response: any) => {
        //     expect(response.response.body.responseMeta.success).to.eq(true);
        //     cy.get(agHelper._actionName)
        //         .click()
        //         .invoke("text")
        //         .then((text) => {
        //             const someText = text;
        //             expect(someText).to.equal(response.response.body.data.name);
        //         });
        // }); // to check if Api1 = Api1 when Create Api invoked

        if (apiName)
            agHelper.RenameWithInPane(apiName)
        cy.get(this._resourceUrl).should("be.visible");
    }

    CreateAndFillApi(url: string, apiname: string = "", queryTimeout = 30000) {
        this.CreateApi(apiname)
        this.EnterURL(url)
        agHelper.AssertAutoSave()
        agHelper.Sleep(2000);// Added because api name edit takes some time to reflect in api sidebar after the call passes.
        cy.get(this._apiRunBtn).should("not.be.disabled");
        this.SetAPITimeout(queryTimeout)
    }

    EnterURL(url: string) {
        cy.get(this._resourceUrl)
            .first()
            .click({ force: true })
            .type(url, { parseSpecialCharSequences: false });
        agHelper.AssertAutoSave()
    }

    EnterHeader(hKey: string, hValue: string) {
        this.SelectAPITab('Headers');
        cy.get(this._headerKey(0))
            .first()
            .click({ force: true })
            .type(hKey, { parseSpecialCharSequences: false })
            .type("{esc}");
        cy.get(this._headerValue(0))
            .first()
            .click({ force: true })
            .type(hValue, { parseSpecialCharSequences: false })
            .type("{esc}");
        agHelper.AssertAutoSave()
    }

    EnterParams(pKey: string, pValue: string) {
        this.SelectAPITab('Params')
        cy.get(this._paramKey(0))
            .first()
            .click({ force: true })
            .type(pKey, { parseSpecialCharSequences: false })
            .type("{esc}");
        cy.get(this._paramValue(0))
            .first()
            .click({ force: true })
            .type(pValue, { parseSpecialCharSequences: false })
            .type("{esc}");
        agHelper.AssertAutoSave()
    }

    EnterBodyFormData(subTab: 'FORM_URLENCODED' | 'MULTIPART_FORM_DATA', bKey: string, bValue: string, type = "") {
        this.SelectAPITab('Body')
        this.SelectSubTab(subTab)
        cy.get(this._bodyKey(0))
            .first()
            .click({ force: true })
            .type(bKey, { parseSpecialCharSequences: false })
            .type("{esc}");
        if (type) {
            cy.xpath(this._bodyTypeDropdown).eq(0).click()
            cy.xpath(this._visibleTextDiv(type)).click()
        }
        cy.get(this._bodyValue(0))
            .first()
            .click({ force: true })
            .type(bValue, { parseSpecialCharSequences: false })
            .type("{esc}");

        agHelper.AssertAutoSave()
    }

    RunAPI() {
        cy.get(this._apiRunBtn).click({ force: true });
        agHelper.ValidateNetworkExecutionSuccess("@postExecute")
    }

    SetAPITimeout(timeout: number) {
        this.SelectAPITab('Settings');
        cy.xpath(this._queryTimeout)
            .clear()
            .type(timeout.toString());
        this.SelectAPITab('Headers');
    }

    SelectAPITab(tabName: 'Headers' | 'Params' | 'Body' | 'Pagination' | 'Authentication' | 'Settings') {
        cy.xpath(this._visibleTextSpan(tabName)).should('be.visible').eq(0).click();
    }

    SelectSubTab(subTabName: 'NONE' | 'JSON' | 'FORM_URLENCODED' | 'MULTIPART_FORM_DATA' | 'RAW') {
        cy.get(this._bodySubTab(subTabName)).eq(0).should('be.visible').click();
    }

    public CheckElementPresence(selector: string) {
        if (selector.startsWith("//"))
            cy.xpath(selector).should('be.visible')
        else
            cy.get(selector).should('be.visible')
    }

    ValidateQueryParams(param: { key: string; value: string; }) {
        this.SelectAPITab('Params')
        agHelper.ValidateCodeEditorContent(this._paramKey(0), param.key)
        agHelper.ValidateCodeEditorContent(this._paramValue(0), param.value)
    }

    ValidateHeaderParams(header: { key: string; value: string; }) {
        this.SelectAPITab('Headers')
        agHelper.ValidateCodeEditorContent(this._headerKey(0), header.key)
        agHelper.ValidateCodeEditorContent(this._headerValue(0), header.value)
    }

    ReadApiResponsebyKey(key: string) {
        let apiResp: string = "";
        cy.get(this._responseBody)
            .contains(key)
            .siblings("span")
            .invoke("text")
            .then((text) => {
                apiResp = `${text.match(/"(.*)"/)![0].split('"').join("")} `;
                cy.log("Key value in api response is :" + apiResp);
                cy.wrap(apiResp).as("apiResp")
            });
    }

    public SelectAPIVerb(verb: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') {
        cy.get(this._apiVerbDropdown).click()
        cy.xpath(this._verbToSelect(verb)).should('be.visible').click()
    }
}