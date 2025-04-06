from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def read_form(request: Request):
    return templates.TemplateResponse("lyricgen.html", {"request": request})

@app.post("/submit")
async def handle_form(
    topic: str = Form(...),
    clusterSelected: str = Form(...),
    mood: str = Form(...)
):
    # Example: Use the double function for fun
    doubled_topic = double(topic)
    return {
        "received": {
            "topic": topic,
            "clusterSelected": clusterSelected,
            "mood": mood
        },
        "doubled_topic": doubled_topic
    }

def double(s):
    return s * 2
