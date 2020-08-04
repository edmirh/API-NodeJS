import React from "react"

class App extends React.Component {
    constructor() {
        super()
        this.state = {
            data: {}
        }
    }

    componentDidMount() {
        fetch("https://localhost:4001/accounts/1")
            .then(response => response.json())
            .then(data => {
                this.setState({
                    data: data
                })
            })
    }

    render() {
        return (
            <div>
                <h1>{this.state.data.first}</h1>
            </div>
        )
    }
}

export default App