import React, { Component } from 'react'

export default class Upload extends Component {
    render() {
        return (
            <div>
                <h2>Upload a file</h2>
                <input type="file"/>
                <br/>
                <button>Submit</button>               
            </div>
        )
    }
}


