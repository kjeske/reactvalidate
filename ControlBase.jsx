import React, { PureComponent } from "react";
import PropTypes from "prop-types";

class ControlBase extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            value: props.field.value === undefined ? "" : props.field.value,
            error: props.field.error
        };

        this.subscription = props.field.subscribe(({ newValue, field }) => {
            this.setState({
                value: newValue,
                error: field.error
            });
        });
    };

    onChange = (e) => {
        const type = this.getElementType(e.nativeEvent.target);
        const value = type === "checkbox" ? e.target.checked : e.target.value;
        this.setState({ value: value });
        this.props.field.update(value, !this.props.field.touched && type === "textbox");
    }

    onBlur = () => {
        this.props.field.touched = true;
        this.props.field.update(this.props.field.value);
    }

    getElementType = (element) => {
        if (element.type && element.type.toLowerCase() === "checkbox") {
            return "checkbox";
        }

        if (element.type && element.type.toLowerCase() === "text") {
            return "textbox";
        }

        return element.tagName.toLowerCase();
    }

    componentWillUnmount() {
        this.subscription.unsubscribe();
    }

    render() {
        const { label, field, Component, ...rest } = this.props;

        return (
            <Component
                error={field.error}
                name={field.name}
                label={label}
                value={this.state.value}
                controlProps={{
                    onChange: this.handleChange,
                    onBlur: this.handleBlur
                }}
                customProps={rest}
                {...rest}
            />
        );
    }
};

ControlBase.propTypes = {
    label: PropTypes.string,
    Component: PropTypes.func,
    field: PropTypes.shape({
        subscribe: PropTypes.func,
        update: PropTypes.func,
        value: PropTypes.any,
        name: PropTypes.string,
        error: PropTypes.string
    })
};

export const createComponent = (Component) => (props) => (
    <ControlBase
        {...props}
        Component={Component}
    />);

export default ControlBase;