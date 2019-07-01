import React, { Component } from "react";
import axios from "axios";
import {
  Button,
  FormGroup,
  Label,
  Input,
  FormText,
  Progress
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./upload.css";
import "bootstrap/dist/css/bootstrap.css";

export default class Upload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedFile: null,
      loaded: 0,
      stage: null
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
        loaded: 0,
        stage: null
      });
    }
  };

  checkFileSize = event => {
    let file = event.target.files[0];
    let size = 314572800; //300 MB in bytes
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
    if (this.state.selectedFile === null) {
      toast.error("Please select a file before upload.");
    } else {
      data.append("file", this.state.selectedFile);
      axios
        .post("https://localhost:5001/api/v1/Files/Upload", data, {
          onUploadProgress: ProgressEvent => {
            this.setState({
              loaded: (ProgressEvent.loaded / ProgressEvent.total) * 100,
              stage: "Uploading"
            });
          }
        })
        .then(res => {
          // then cipher file
          console.log("cipher start");
          axios
            .get("https://localhost:5001/api/v1/cipher/encode", {
              params: {
                filename: res.data.fileName
              },
              onUploadProgress: ProgressEvent => {
                this.setState({
                  loaded: (ProgressEvent.loaded / ProgressEvent.total) * 100,
                  stage: "Encoding"
                });
              }
            })
            .then(res => {
              console.log("download start");
              downloadFilename = res.data.filename;
              axios
                .get("https://localhost:5001/api/v1/files/download", {
                  params: {
                    filename: res.data.filename
                  },
                  onUploadProgress: ProgressEvent => {
                    this.setState({
                      loaded:
                        (ProgressEvent.loaded / ProgressEvent.total) * 100,
                      stage: "downloading"
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
                  this.setState({
                    loaded: 0,
                    stage: null
                  });
                  console.log(this.state.stage);
                })
                .catch(err => {
                  toast.error("Downloading failed");
                });
            })
            .catch(err => {
              toast.error("Encription failed");
            });
        })
        .catch(err => {
          // then print response status
          toast.error("Upload failed");
        });
    }
  };

  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="offset-md-3 col-md-6">
            <div className="form-group files">
              <Label className="label">Upload Your File </Label>
              <FormGroup className="form-control">
                <Input
                  type="file"
                  name="file"
                  id="file"
                  onChange={this.onChangeHandler}
                />
                <FormText color="muted">
                  Insert .txt file with the size less than 300MB.
                </FormText>
              </FormGroup>
            </div>
            <div className="form-group">
              <ToastContainer
                position="top-right"
                autoClose={2000}
                draggable={true}
              />

              <label className="label-state">{this.state.stage}</label>
              <div className="offset-md-2 col-md-8">
                <Progress max="100" color="success" value={this.state.loaded}>
                  {Math.round(this.state.loaded, 2)}%
                </Progress>
              </div>
            </div>

            <Button
              type="button"
              className="btn btn-success col-md-8 col-md-offset-4"
              onClick={this.onClickHandler}
            >
              Upload and encode file
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
