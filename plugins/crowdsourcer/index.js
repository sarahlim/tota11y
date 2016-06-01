/**
 * Display information about relevant CSS attributes to users
 */

let $ = require("jquery");
let Plugin = require("../base");
let annotate = require("../shared/annotate")("labels");
let el2Partition = require("./filterCss");
let _ = require("lodash");

let propListTemplate = require("./prop-list.handlebars");

require("./style.less");

class Crowdsourcer extends Plugin {

    getTitle() {
        return "Tag Components";
    }

    getDescription() {
        return "Tag components on the page";
    }

    // Takes an object of properties,
    // creates a Handlebars context,
    // evaluates the template and returns the HTML
    propList(props) {
        return propListTemplate({
            props: props,
        });
    }

    run() {
        const that = this;
        let $highlights = [];
        let count = 0;
        let $selections = [];

        // Provide a fake summary to force the info panel to render
        this.summary("Select components of the layout");

        // When CONTAINERS_ONLY is active,
        // highlighting and clicking will only work on:
        // div, section, article, aside, nav, header,
        // footer, and menu elements
        const CONTAINERS = [
            "div",
            "section",
            "article",
            "aside",
            "nav",
            "header",
            "footer",
            "menu",
            "li",
        ];

        // Mousemove handler controls highlighting behavior
        $(document).on("mousemove.wand", function(e) {
            const currentEl = document.elementFromPoint(e.clientX, e.clientY);
            const tag = _.toLower(currentEl.tagName);
            const CONTAINERS_ONLY = true;

            // Don't outline something if it's part of the app,
            // or not a container element when CONTAINERS_ONLY is true
            const invalidTarget = _.some([
                _.includes(currentEl.tagName, "body"),
                CONTAINERS_ONLY && !_.includes(CONTAINERS, tag),
                _.includes(currentEl.className, "tota11y")
            ]);

            // Outline the element currently being hovered over
            if (!invalidTarget) {
                const old = ".tota11y-outlined-" + (count > 0 ? count - 1 : 0).toString();
                const current = "tota11y-outlined-" + count.toString();
                $(old).removeClass(old.substr(1));
                $(currentEl).addClass(current);
                console.log(currentEl);
            }
        });

        // Click handler gets and displays CSS information
        $(document).on("click", function(e) {

            // Prevent default if we clicked the application
            const isApp = this.className.indexOf("tota11y") !== -1;
            const hasOutline = this.className.indexOf("tota11y-outlined") !== -1;

            // Continue iff the element is outlined
            if (!hasOutline) {
                return true;
            }

            e.stopPropagation();

            // After we stop propagating, set clickedEl
            const clickedEl = this;
            const $el = $(clickedEl);
            console.log(clickedEl);

            // Send info to panel
            $selections.push({
                node: $el,
                tag: clickedEl.tagName,
                classList: clickedEl.classList,
                id: clickedEl.id,
            });

            // Control highlighting
            $highlights.push(annotate.highlight($el, count));
            count += 1;
            console.log(count);

            // Partition the style properties
            const partition = el2Partition(clickedEl);
            const propTypeOrder = [
                "position",
                "box_model",
                "typography",
                "visual",
                "misc"
            ];

            // Iterate over partition classes in the above order.
            // For each, we create the Handlebars ul,
            // and pass it to the base Plugin error handler using
            // the propList method.
            let propObjList = [];

            propTypeOrder.forEach(function (type) {
                const props = partition[type];
                if (Object.keys(props).length > 0) {
                    const title = type.replace("_", " ");

                    // Evaluate the prop list template
                    let $list = $(this.propList(props));
                    const propObj = { title, $list, $el };
                    propObjList.push(propObj);
                }
            }, that);

            let propEntries = that.props(propObjList);
            // propEntries.forEach((entry) => {
            //     if (entry) {
            //         const context = [entry.$el, "", entry.title, entry];
            //         annotate.errorLabel(...context);

            //         // Highlight the current element on the page
            //         const highlight = annotate.highlight(entry.$el);
            //     }
            // });

            // Render updates
            that.panel.render();

            // const styleStrings = "";

            // // Populate the info panel
            // if (!styleStrings) {
            //     $(".tota11y-info-section.active").html(
            //         <i className="tota11y-nothingness">
            //             Nothing available
            //         </i>
            //     );
            // } else {
            //     // Place an error label on the element and register it as an
            //     // error in the info panel
            //     // let entry = this.error(title, $(this.errorMessage($el)), $el);
            //     // annotate.errorLabel($el, "", title, entry);

            //     $(".tota11y-info-section.active").html(
            //         styleStrings
            //     );
            // }
        });
    }

    cleanup() {
        $(".tota11y-outlined").removeClass("tota11y-outlined");
        $(document).off("mousemove.wand");
        $(document).off("click.wand");
    }
}

module.exports = Crowdsourcer;
