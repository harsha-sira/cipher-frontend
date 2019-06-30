import React, { Component } from "react";
import axios from "axios";
import { Progress } from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default class Upload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedFile: null,
      loaded: 0,
      filename: ""
    };
  }

  onChangeHandler = event => {
    if (
      this.maxSelectFile(event) &&
      this.checkMimeType(event) &&
      this.checkFileSize(event)
    ) {
      this.setState({
        selectedFile: event.target.files[0],
        loaded: 0
      });
    }
  };

  checkFileSize = event => {
    let file = event.target.files[0];
    let size = 300000000; // in bytes
    let err = "";

    if (file.size > size) {
      err +=
        file.type + "is too large, please pick a smaller file than 300MB\n";
    }
    if (err !== "") {
      event.target.value = null;
      console.log(err);
      toast.error(err);
      return false;
    }
    return true;
  };

  maxSelectFile = event => {
    let files = event.target.files; // create file object
    if (files.length > 1) {
      const msg = "Only 1 file can be uploaded at a time";
      event.target.value = null; // discard selected file
      console.log(msg);
      toast.warn(msg);
      return false;
    }
    return true;
  };

  checkMimeType = event => {
    //getting file object
    let file = event.target.files[0];
    //define message container
    let err = "";
    // list allow mime type
    const types = ["text/plain"];

    if (types.every(type => file.type !== type)) {
      // create error message and assign to container
      err += file.type + " is not a supported format\n";
    }

    if (err !== "") {
      // if message not same old that mean has error
      event.target.value = null; // discard selected file
      console.log(err);
      toast.error(err);
      return false;
    }
    return true;
  };

  onClickHandler = () => {
    const data = new FormData();
    var downloadFilename;
    data.append("file", this.state.selectedFile);
    axios
      .post("https://localhost:5001/api/v1/Files/Upload", data, {
        onUploadProgress: ProgressEvent => {
          this.setState({
            loaded: (ProgressEvent.loaded / ProgressEvent.total) * 100
          });
        }
      })
      .then(res => {
        // then cipher file
        axios
          .get("https://localhost:5001/api/v1/cipher/encode", {
            params: {
              filename: res.data.fileName
            },
            onUploadProgress: ProgressEvent => {
              this.setState({
                loaded: (ProgressEvent.loaded / ProgressEvent.total) * 100
              });
            }
          })
          .then(res => {
            downloadFilename = res.data.filename;
            axios
              .get("https://localhost:5001/api/v1/files/download", {
                params: {
                  filename: res.data.filename
                },
                onUploadProgress: ProgressEvent => {
                  this.setState({
                    loaded: (ProgressEvent.loaded / ProgressEvent.total) * 100
                  });
                }
              })
              .then(res => {
                
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement("a");
                link.href = url;
                
                link.setAttribute("download", downloadFilename);

                // // 3. Append to html page
                document.body.appendChild(link);

                // // 4. Force download
                link.click();
                
                // // 5. Clean up and remove the link
                link.parentNode.removeChild(link);
                toast.success("Downloaded");
              })
              .catch(err => {
                toast.error("Download fail");
              });
          })
          .catch(err => {
            toast.error("Cipher fail");
          });
      })
      .catch(err => {
        // then print response status
        toast.error("upload fail");
      });
  };

  render() {
    return (
      <div class="container">
        <div class="row">
          <div class="offset-md-3 col-md-6">
            <div class="form-group files">
              <label>Upload Your File </label>
              <input
                type="file"
                className="form-control"
                name="file"
                onChange={this.onChangeHandler}
              />
            </div>
            <div class="form-group">
              <ToastContainer />
              <div class="offset-md-3 col-md-6">
                <Progress max="100" color="success" value={this.state.loaded}>
                  {Math.round(this.state.loaded, 2)}%
                </Progress>
              </div>
            </div>

            <button
              type="button"
              class="btn btn-success btn-block"
              onClick={this.onClickHandler}
            >
              Upload and encode file
            </button>
          </div>
        </div>
      </div>
    );
  }
}
