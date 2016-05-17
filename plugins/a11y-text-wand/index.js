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

class A11yTextWand extends Plugin {
    getTitle() {
        return "Highlight Elements";
    }

    getDescription() {
        return "Hover over elements to view their CSS";
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

        // Provide a fake summary to force the info panel to render
        // this.summary(" ");

        // When CONTAINERS_ONLY is active,
        // highlighting and clicking will only work on:
        // div, section, article, aside, nav, header,
        // footer, and menu elements
        let CONTAINERS_ONLY = true;
        const CONTAINERS = [
            "div",
            "section",
            "article",
            "aside",
            "nav",
            "header",
            "footer",
            "menu"
        ];

        // Mousemove handler controls highlighting behavior
        $(document).on("mousemove.wand", function(e) {
            const currentEl = document.elementFromPoint(e.clientX, e.clientY);
            const tag = _.toLower(currentEl.tagName);

            // Don't outline something if it's part of the app,
            // or not a container element when CONTAINERS_ONLY is true
            const invalidTarget = _.some([
                CONTAINERS_ONLY && !_.includes(CONTAINERS, tag),
                _.includes(currentEl.className, "tota11y")
            ]);

            if (!invalidTarget) {
                $(".tota11y-outlined").removeClass("tota11y-outlined");
                $(currentEl).addClass("tota11y-outlined");
            }
        });

        // Click handler gets and displays CSS information
        $(document).on("click", ".tota11y-outlined", function(e) {

            // Stop propagation if we clicked an app element
            if (this.className.indexOf("tota11y") !== -1 &&
                this.className.indexOf("tota11y-outlined") === -1) {
                console.log("clicked on app");
                // e.preventDefault();
                e.stopPropagation();
            }

            const clickedEl = this;
            console.log(clickedEl);

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
                    const title = type.replace("_", " ");  // TODO: change this
                    const $el = $(clickedEl);

                    // Evaluate the prop list template
                    let $list = $(this.propList(props));
                    const propObj = { title, $list, $el };
                    propObjList.push(propObj);
                }
            }, that);

            let propEntries = that.props(propObjList);
            propEntries.forEach((entry) => {
                if (entry) {
                    annotate.errorLabel(entry.$el, "", entry.title, entry);
                }
            });

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

module.exports = A11yTextWand;
