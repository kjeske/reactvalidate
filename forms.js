const validateField = (field, fieldsValidators, formValues) => {
    if (fieldsValidators && fieldsValidators.length !== 0) {
        for (let validator of fieldsValidators) {
            if (validator.length !== 2) {
                throw new Error("Invalid configuration");
            }

            const isFieldValid = validator[1](field.value, formValues);

            if (!isFieldValid) {
                return {
                    isValid: isFieldValid,
                    errorMessage: !isFieldValid ? validator[0] : null
                };
            }
        }
    }

    return {
        isValid: true,
        errorMessage: null
    };
};

const onChange = (name, newValue, subscribers, form, validators, suspendValidation, formSubscribers) => {
    const field = form[name];
    field.value = newValue;

    if (validators && !suspendValidation) {
        field.error = validateField(field, validators[name], getFormValues(form)).errorMessage;
    }

    for (let subscriber of subscribers) {
        subscriber({ newValue: newValue, field: field, form: form });
    }

    for (let subscriber of formSubscribers) {
        subscriber();
    }
};

const validateFields = (form, validators) => {
    let isValid = true;
    const formValues = getFormValues(form);

    for (let name in validators) {
        if (!validators.hasOwnProperty(name)) {
            continue;
        }

        const validationResult = validateField(form[name], validators[name], formValues);

        form[name].error = validationResult.errorMessage;
        form[name].update(form[name].value);

        if (!validationResult.isValid) {
            isValid = false;
        }
    }

    return isValid;
};

const getFormValues = (form) => {
    let result = {};
    for (let name in form) {
        if (!form.hasOwnProperty(name)) {
            continue;
        }

        result[name] = form[name].value;
    }
    return result;
};

export const createForm = (fields, validators) => {
    const form = {};

    const formSubscribers = [];

    for (let name in fields) {
        if (!fields.hasOwnProperty(name)) {
            continue;
        }

        const subscribers = [];

        form[name] = {
            name: name,
            value: fields[name],
            error: null,
            touched: false,
            subscribe: callback => {
                subscribers.push(callback);
                return {
                    unsubscribe: () => subscribers.splice(subscribers.indexOf(callback), 1)
                };
            },
            _subscribers: subscribers,
            update: (newValue, suspendValidation) => onChange(name, newValue, subscribers, form, validators, suspendValidation, formSubscribers)
        };
    }

    const subscribeToForm = callback => {
        formSubscribers.push(callback);
        return {
            unsubscribe: () => formSubscribers.splice(formSubscribers.indexOf(callback), 1)
        };
    };

    return {
        fields: form,
        isValid: () => validateFields(form, validators, getFormValues(form)),
        getValues: () => getFormValues(form),
        subscribe: subscribeToForm,
        subscribeOnce: callback => {
            const { unsubscribe } = subscribeToForm(() => {
                callback();
                unsubscribe();
            });
        }
    };
};

const emailRegex = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

export const validators = {
    required: ["Value is required", (value) => !!value],
    email: ["Value has to be an email address", (value) => emailRegex.test(value)]
};