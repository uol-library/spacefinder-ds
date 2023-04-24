document.addEventListener( 'DOMContentLoaded', () => {
    /* add radio button behaviour to checkboxes with exclusive attribute */
    const filters = document.querySelectorAll( '#search-filters input[type=checkbox]' );
    for (const cbx of filters) {
        cbx.addEventListener( 'change', eventElement => {
            const item = eventElement.target;
            if (item.matches( '.exclusive' ) ) {
                const itemStatus = item.checked;
                const sibs = item.closest( '.uol-form__custom-fieldset' ).querySelectorAll( 'input[type=checkbox].exclusive' );
                for (const sib of sibs) {
                    sib.checked = false;
                }
                item.checked = itemStatus;
            }
            /* trigger the viewfilter event */
            item.dispatchEvent( new Event( 'viewfilter', { bubbles: true } ) );
        });
    }
    document.addEventListener( 'click', event => {
        /**
         * These remove search terms or filter terms when one of them is
         * clicked in the filter status message. Maybe need to refactor filter
         * status message and these events to filters.js?
         */
        if ( event.target.classList.contains( 'search-term' ) ) {
            event.preventDefault();
            let searchtext = event.target.getAttribute( 'data-searchtext' );
            let searchinput = document.getElementById( 'search-input' ).value.trim();
            let searchterms = searchinput.split( ' ' );
            let newsearchterms = [];
            searchterms.forEach( term => {
                if ( term != searchtext ) {
                    newsearchterms.push( term );
                }
            });
            document.getElementById( 'search-input' ).value = newsearchterms.join(' ');
            document.dispatchEvent( new Event( 'viewfilter', { bubbles: true } ) );
        } else if ( event.target.classList.contains( 'filter-term' ) ) {
            event.preventDefault();
            let termid = event.target.getAttribute( 'data-termid' );
            console.log(termid);
            document.getElementById( termid ).checked = false;
            document.dispatchEvent( new Event( 'viewfilter', { bubbles: true } ) );
        }
    });
    document.addEventListener( 'viewfilter', applyFilters );

    document.addEventListener( 'filtersapplied', updateListFilterMessage );
});
/**
 * Applies filters to the list of spaces
 */
function applyFilters() {
    const activeFilters = getFilterStatus();
    let searchcondition = '';
    if ( activeFilters.length ) {
        document.querySelectorAll( '.list-space' ).forEach( el => {
            el.classList.remove( 'hidden' );
            let showEl = true;
            activeFilters.forEach( filtergroup => {
                if ( filtergroup.name == 'search' ) {
                    let foundKw = false;
                    filtergroup.value.forEach( term => {
                        if ( el.textContent.toLowerCase().indexOf( term.toLowerCase() ) != -1 ) {
                            foundKw = true;
                        }
                    });
                    if ( ! foundKw ) {
                        showEl = false;
                    }
                } else if ( filtergroup.name == 'open' ) {
                    if ( el.getAttribute( 'data-openclass' ) != 'open' ) {
                        showEl = false;
                    }
                } else {
                    let filterdata = getFilterData( filtergroup.name );
                    if ( filterdata.additive ) {
                        // if the filter is additive, only show if all filters are true
                        let miss = false;
                        filtergroup.value.forEach( val => {
                            if ( ! el.classList.contains( filtergroup.name + '_' + val ) ) {
                                miss = true;
                            }
                        });
                        if ( miss === true ) {
                            showEl = false;
                        }
                    } else {
                        // not additive - match any
                        let regex = filtergroup.name+'_('+filtergroup.value.join('|')+')';
                        if ( ! el.className.match(regex) ) {
                            showEl = false;
                        }
                    }
                }
            });
            if ( ! showEl ) {
                el.classList.add( 'hidden' );
            }
        });
    } else {
        document.querySelectorAll( '.list-space' ).forEach( el => {
            el.classList.remove( 'hidden' );
        });
    }
    document.dispatchEvent( new Event( 'filtersapplied' ) );
}

function getFilterData( filterkey, optionkey ) {
    let fel = document.getElementById( filterkey );
    let filterdata = {};
    filterdata.additive = ( fel.getAttribute( 'data-additive' ) === "true" );
    filterdata.label = fel.getAttribute( 'data-label' );
    filterdata.message = fel.getAttribute( 'data-message' );
    filterdata.options = [];
    fel.querySelectorAll( 'input[type=checkbox]' ).forEach( cbx => {
        filterdata.options.push({
            key: cbx.getAttribute( 'data-optionkey' ),
            label: cbx.getAttribute( 'data-optionlabel' )
        });
    });
    return filterdata;
}
/**
 * Updates the message above the list of spaces to show what 
 * search terms and filters are active
 */
function updateListFilterMessage() {
    let activeFilters = getFilterStatus();
    let container = document.getElementById( 'listfilters' );
    /* empty any existing messages and hide */
    container.textContent = '';
    container.setAttribute( 'hidden', '' );
    let searchmessage = filtermessage = resultsmessage = '';
    if ( activeFilters.length ) {
        /* add search and filter messages - buttons will remove filters/terms */
        activeFilters.forEach( f => {
            if ( f.name == 'search' ) {
                let pl = f.value.length > 1 ? 's': '';
                searchmessage = '<p>Searching spaces which contain text: ';
                let termlist = [];
                f.value.forEach( term => {
                    termlist.push( '<button class="uol-chips__button search-term icon-remove" data-searchtext="' + term + '">' + term + '</button>' );
                });
                searchmessage += termlist.join( ' or ' ) + '</p>';
            } else {
                let filterdata = getFilterData( f.name );
                if ( filterdata.options.length === 1 ) {
                    filtermessage += '<p><button class="uol-chips__button filter-term icon-remove" data-termid="' + f.name + '_' + f.value + '">' + filterdata.message + '</button>';
                } else {
                    filtermessage += '<p>' + filterdata.message;
                    let termlist = [];
                    f.value.forEach( term => {
                        let termlabel = '';
                        filterdata.options.forEach( opt => {
                            if ( opt.key === term ) {
                                termlabel = opt.label;
                            }
                        });
                        termlist.push( '<button class="uol-chips__button filter-term icon-remove" data-termid="' + f.name + '_' + term + '"><span class="uol-chips__text" role="text"><span class="hide-accessible">Cancel</span>' + termlabel + '</span><span class="uol-chips__delete-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path fill="#000000" fill-rule="nonzero" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path></svg></span></button>' );
                    });
                    filtermessage += termlist.join( filterdata.additive ? ' and ': ' or ' ) + '</p>';
                }
            }
        });
    }
    /* get count of spaces */
    let spacetotal = document.querySelectorAll( '.list-space' ).length;
    let spacesShowing = spacetotal;
    /* decrease spaces count if some are hidden */
    if ( document.querySelectorAll( '.list-space.hidden' ) != null ) {
        spacesShowing -= document.querySelectorAll( '.list-space.hidden' ).length;
        /* show zero results message */
        if ( spacesShowing == 0 ) {
            resultsmessage = '<p class="noresults">Sorry, your search has found no results - try removing some of your search criteria.</p>';
        }
    }
    /* add filter, search and results messages */
    if ( ( searchmessage + filtermessage + resultsmessage ) != '' ) {
        container.innerHTML = searchmessage + filtermessage + resultsmessage;
        container.removeAttribute( 'hidden' );
    }
    /* update spaces showing count */
    document.getElementById( 'searchResultsSummary' ).textContent = 'Showing ' + spacesShowing + ' of ' + spacetotal + ' spaces';
}
/**
 * Gets the current status of all filters
 * @return {Object} activeFilters
 */
function getFilterStatus() {
    const filters = document.querySelectorAll( '#search-filters input[type=checkbox]' );
    const activeFilters = [];
    for (const cbx of filters) {
        if (cbx.checked) {
            const filterName = cbx.getAttribute( 'data-filterkey' );
            const filterValue = cbx.getAttribute( 'data-optionkey' );
            let appended = false;
            if ( activeFilters.length ) {
                for ( let i = 0; i < activeFilters.length; i++ ) {
                    if ( activeFilters[i].name == filterName && activeFilters[i].value.indexOf( filterValue ) == -1 ) {
                        activeFilters[i].value.push( filterValue );
                        appended = true;
                    }
                }
            }
            if ( ! appended ) {
                activeFilters.push({
                    name: filterName,
                    value: [filterValue]
                });
            }
        }
    }
    let inputvalue = document.getElementById( 'search-input' ).value.trim();
    if ( inputvalue.length > 1 ) {
        activeFilters.push({
            name: 'search',
            value: inputvalue.split( ' ' )
        });
    }
    return activeFilters;
}
    