/**
 * Created by abradley on 01/03/2018.
 */

import SVGInline from "react-svg-inline";
import React from "react";
import {ListGroup, Pager, Well} from "react-bootstrap";
import fetch from "cross-fetch";
import * as listTypes from "./listTypes";
export function FillMe(props) {
    return <h1>FILL ME UP PLEASE</h1>;
}

// Generic Classes
export class GenericList extends React.Component {

    constructor(props) {
        super(props);
        this.old_url = ''
        this.loadFromServer = this.loadFromServer.bind(this);
        this.getUrl = this.getUrl.bind(this);
        this.handleOptionChange = this.handleOptionChange.bind(this);
        this.processResults = this.processResults.bind(this);
        this.beforePush = this.beforePush.bind(this)
        this.afterPush = this.afterPush.bind(this)
    }

    beforePush() {
    }

    afterPush(data) {
    }

    /**
     * Logic to generate the url - here is the logic that connects listTypes to my API
     * @returns {URL}
     */
    getUrl() {
        // This should be defined by type
        var base_url = window.location.protocol + "//" + window.location.host
        if (DJANGO_CONTEXT["pk"] != undefined) {
            var userId = DJANGO_CONTEXT["pk"].toString()
        } else {
            var userId = null;
        }
        // Set the version
        base_url += "/api/"
        var get_params = {}
        if (this.list_type == listTypes.TARGET) {
            base_url += "targets/"
            if (this.props.project_id != undefined) {
                get_params.project_id = this.props.project_id
            }
        }
        else if (this.list_type == listTypes.MOLGROUPS) {
            if (this.props.target_on != undefined) {
                get_params.target_id = this.props.target_on
                base_url += "molgroup/"
                get_params.group_type = this.props.group_type
            }
        }
        else if (this.list_type == listTypes.MOLECULE) {
            if (this.props.target_on != undefined && this.props.mol_group_on != undefined) {
                // mol group choice
                base_url += "molecules/"
                get_params.mol_groups = this.props.mol_group_on
                get_params.mol_type = "SD"
            }
        }
        else if (this.list_type == listTypes.PANDDA_EVENT) {
            if (this.props.target_on != undefined && this.props.pandda_site_on != undefined) {
                // mol group choice
                base_url += "events/"
                get_params.target_id = this.props.target_on
                get_params.limit = -1
                get_params.pandda_site = this.props.pandda_site_on
            }
        }
        else if (this.list_type == listTypes.PANDDA_SITE) {
            if (this.props.target_on != undefined) {
                // mol group choice
                base_url += "sites/"
                get_params.target_id = this.props.target_on
                get_params.limit = -1
            }
        }
        else if (this.list_type == listTypes.HOTSPOT) {
            if (this.props.target_on != undefined) {
                base_url += "hotspots/"
                get_params.target_id = this.props.target_on
            }
        }
        else if (this.list_type == listTypes.SESSIONS) {
            base_url += "viewscene/?user_id="+ userId
            if (this.props.project_id != undefined) {
                get_params.project_id = this.props.project_id
                this.props.setSeshListSaving(true);
            }
        }
        else if (this.list_type == listTypes.E_DENSITY) {
            if (this.props.target_on != undefined) {
                base_url += "proteins/"
                get_params.target_id = this.props.target_on
            }
        }
        else {
            console.log("DEFAULT")
        }
        var url = new URL(base_url)
        Object.keys(get_params).forEach(key => url.searchParams.append(key, get_params[key]))
        return url
    }

    /**
     * Process the results - switched to be used for pagination
     * @param json
     * @returns {*}
     */
    processResults(json) {
        var results = json.results;
        this.afterPush(results)
        if (this.list_type == listTypes.SESSIONS && this.props.seshListSaving == true) {this.props.setSeshListSaving(false)}
        return results;
    }

    loadFromServer() {
        const url = this.getUrl();
        if (url.toString() != this.old_url) {
            this.beforePush();
            fetch(url)
                .then(
                    response => response.json(),
                    error => console.log('An error occurred.', error)
                )
                .then(
                    json => this.props.setObjectList(this.processResults(json))
                )
        }
        this.old_url = url.toString();
    }

    handleOptionChange(changeEvent) {
        const new_value = changeEvent.target.value;
        this.props.setObjectOn(new_value);
    }

    componentDidMount() {
        this.loadFromServer();
        setInterval(this.loadFromServer, 50);
    }

    render() {
        if (this.props != undefined && this.props.object_list) {
            console.log(this.props.message)
            return <ListGroup>
                {
                    this.props.object_list.map((data) => (this.render_method(data)))
                }
            </ListGroup>;
        }
        else {
            return (<FillMe/>)
        }
    }
}

export class GenericView extends React.Component {

    constructor(props) {
        super(props);
        this.loadFromServer = this.loadFromServer.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.not_selected_style = {
            width: (props.width + 5).toString() + 'px',
            height: (props.height + 5).toString() + 'px',
            display: "inline-block"
        }
        this.old_url = ''
        this.state = {
            isToggleOn: false,
            img_data: '<svg width="40" height="20" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="10" cy="10">' +
                '<animate attributeName="r" begin="0s" dur="0.8s" values="5;2;5" calcMode="linear" repeatCount="indefinite" />' +
                '<animate attributeName="fill-opacity"begin="0s" dur="0.8s" values="1;.5;1" calcMode="linear" repeatCount="indefinite" />' +
            '</circle>' +
            '<circle cx="20" cy="10"fill-opacity="0.3">' +
                '<animate attributeName="r" begin="0s" dur="0.8s" values="2;5;2" calcMode="linear" repeatCount="indefinite" />'+
                '<animate attributeName="fill-opacity" begin="0s" dur="0.8s" values=".5;1;.5" calcMode="linear" repeatCount="indefinite" />' +
            '</circle>' +
            '<circle cx="30" cy="10">' +
                '<animate attributeName="r" begin="0s" dur="0.8s" values="5;2;5" calcMode="linear" repeatCount="indefinite" />' +
                '<animate attributeName="fill-opacity" begin="0s" dur="0.8s" values="1;.5;1" calcMode="linear" repeatCount="indefinite" />' +
            '</circle>' +
        '</svg>',
            value: [],
            vectorOn: false,
            complexOn: false,
            eDensityOn:false
        }
        this.selected_style = {
            width: (props.width).toString() + 'px',
            height: (props.height).toString() + 'px',
            display: "inline-block",
            backgroundColor: "#B7C185"
        }
        this.conf_on_style = {borderStyle: "solid"}
        this.comp_on_style = {backgroundColor: "#B7C185"}
    }

    loadFromServer(width, height) {
        var url = this.url;
        var get_params = {
            "width": width,
            "height": height,
        }
        Object.keys(get_params).forEach(key => url.searchParams.append(key, get_params[key]))
        if (this.key == undefined) {
            if (url.toString() != this.old_url) {
                fetch(url)
                    .then(
                        response => response.text(),
                        error => console.log('An error occurred.', error)
                    )
                    .then(text => this.setState(prevState => ({img_data: text})))
            }
        }
        else {
            if (url.toString() != this.old_url) {
                fetch(url)
                    .then(
                        response => response.json(),
                        error => console.log('An error occurred.', error)
                    )
                    .then(text => this.setState(prevState => ({img_data: text[this.key]})))
            }
        }
        this.old_url = url.toString();

    }

    componentDidMount() {
        this.loadFromServer(this.props.width, this.props.height);
    }

    clickHandle() {
    }

    handleStop(e, data) {
        // Move this element from list A to list B if it moves to that zone
        const fromElement = e.fromElement;
        const toElement = e.toElement;
        const eleMove = data.node;
    }

    handleClick() {
        this.setState(prevState => ({isToggleOn: !prevState.isToggleOn}))
    }

    render() {
        const svg_image = <SVGInline svg={this.state.img_data}/>;
        this.current_style = this.state.isToggleOn ? this.selected_style : this.not_selected_style;
        return <div onClick={this.handleClick} style={this.current_style}>{svg_image}</div>
    }
}

export class Slider extends React.Component {

    constructor(props) {
        super(props);
        this.handleForward = this.handleForward.bind(this);
        this.handleBackward = this.handleBackward.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.checkForUpdate = this.checkForUpdate.bind(this);
        this.newOption = this.newOption.bind(this);
        this.state = {currentlySelected: -1, progress: 0, progress_string: ""}
        this.slider_name = "DEFAULT"
    }

    render() {
        this.progress = this.state.progress;
        const pager = <Pager>
            <Pager.Item onClick={this.handleBackward}>Previous</Pager.Item>{' '}
            <Pager.Item onClick={this.handleForward}>Next</Pager.Item>
        </Pager>
        const error_text = "No " + this.slider_name + " available";
        var meat_of_div;
        if (this.props.object_list == undefined || this.props.object_list.length == 0) {
            meat_of_div = error_text;
        }
        else {
            meat_of_div = pager;
        }

        return <Well bsSize="small">
            <h4>{this.slider_name} Selector</h4>  {this.state.progress_string}
            {meat_of_div}
        </Well>;
    }

    newOption(new_value) {
    }

    handleForward() {
        var selected = this.state.currentlySelected;
        if (selected < this.props.object_list.length - 1) {
            selected += 1
            this.handleChange(selected);
        }
        else {
            selected = 0
            this.handleChange(selected);
        }
    }

    handleBackward() {
        var selected = this.state.currentlySelected;
        if (selected > 0) {
            selected -= 1
            this.handleChange(selected);
        }
        else {
            selected = this.props.object_list.length - 1;
            this.handleChange(selected);
        }
    }

    handleChange(selected) {
        var progress = 100 * selected / (this.props.object_list.length - 1)
        var prog_string = "On " + (selected + 1).toString() + " / " + this.props.object_list.length.toString();
        this.setState(prevState => ({
            currentlySelected: selected, progress: progress,
            progress_string: prog_string
        }))
        this.props.setObjectOn(this.props.object_list[selected].id)
        this.newOption(this.props.object_list[selected].id)
    }

    checkForUpdate() {
        if (this.props.object_list != []) {
            var selected;
            var counter = 0
            for (var index in this.props.object_list) {
                if (this.props.object_list[index].id == this.props.object_on) {
                    selected = counter;
                }
                counter += 1
            }
            if (selected != undefined && selected != this.state.currentlySelected) {
                this.handleChange(selected);
            }
        }
    }

    componentDidMount() {
        setInterval(this.checkForUpdate, 50);
    }
}