const React = require('react');
const store = require('../store');
const { SUPPORTED_PLATFORMS } = require('../constants');
const PlatformSetting = require('./PlatformSetting');

const AllPlatformsSettings = React.createClass({
    onClickHandler() {
        SUPPORTED_PLATFORMS.forEach(platform => {
            store.disablePlatform(platform);
            ga('send', 'event', 'Platform Setting', 'UnCheck', platform);
        });
        this.forceUpdate();
    },
    render() {
        return (
            <div>
                {SUPPORTED_PLATFORMS.map(platform => (
                    <div>
                        <PlatformSetting platform={platform} />
                        <hr />
                    </div>
                ))}
                <li className="platform-setting button-unsubscribe" onClick={this.onClickHandler}>
                    <span className="unsubscribe-text">
                    Unsubscribe from All
                    </span>
                </li>
                <hr />
            </div>
        );
    },
});

module.exports = AllPlatformsSettings;