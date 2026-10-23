"""可运行的工具分发示例。

fake_model 只用来演示循环，它不是大模型。替换 run_agent 里的 fake_model
即可把同一套分发接到真实的工具调用接口。
"""

from __future__ import annotations

import json
from collections.abc import Callable

Tool = Callable[..., str]
Message = dict[str, object]


def dispatch_tool(registry: dict[str, Tool], name: str, arguments_json: str) -> str:
    """执行 registry 中名为 name 的工具。arguments_json 必须是 JSON 对象。"""
    if name not in registry:
        raise KeyError(f"unknown tool: {name}")
    try:
        arguments = json.loads(arguments_json)
    except json.JSONDecodeError as error:
        raise ValueError(f"invalid tool arguments for {name}") from error
    if not isinstance(arguments, dict):
        raise ValueError(f"tool arguments must be a JSON object for {name}")
    result = registry[name](**arguments)
    if not isinstance(result, str):
        raise TypeError(f"tool {name} must return str")
    return result


def get_time(city: str) -> str:
    return f"{city} 12:00"


def fake_model(messages: list[Message], tools: list[dict[str, object]]) -> Message:
    """第一次请求时提出工具调用，看到工具结果后给出最终文本。"""
    del tools
    if not any(message.get("role") == "tool" for message in messages):
        return {
            "role": "assistant",
            "tool_calls": [
                {
                    "id": "call_1",
                    "function": {
                        "name": "get_time",
                        "arguments": '{"city": "上海"}',
                    },
                }
            ],
        }
    tool_content = str(messages[-1].get("content", ""))
    return {"role": "assistant", "content": f"工具返回了 {tool_content}"}


def run_agent(user_text: str) -> str:
    registry: dict[str, Tool] = {"get_time": get_time}
    tools = [
        {
            "name": "get_time",
            "description": "查询城市的当地时间",
            "parameters": {
                "type": "object",
                "properties": {"city": {"type": "string"}},
                "required": ["city"],
            },
        }
    ]
    messages: list[Message] = [{"role": "user", "content": user_text}]
    for _ in range(4):
        message = fake_model(messages, tools)
        messages.append(message)
        calls = message.get("tool_calls")
        if not isinstance(calls, list) or not calls:
            content = message.get("content")
            if not isinstance(content, str):
                raise RuntimeError("model returned an empty final answer")
            return content
        for call in calls:
            if not isinstance(call, dict):
                raise RuntimeError("tool call must be an object")
            function = call.get("function")
            if not isinstance(function, dict):
                raise RuntimeError("tool call is missing function")
            name = function.get("name")
            arguments = function.get("arguments")
            call_id = call.get("id")
            if not isinstance(name, str) or not isinstance(arguments, str) or not isinstance(call_id, str):
                raise RuntimeError("tool call fields must be strings")
            result = dispatch_tool(registry, name, arguments)
            messages.append({"role": "tool", "tool_call_id": call_id, "content": result})
    raise RuntimeError("agent loop exceeded max steps")


def main() -> None:
    if dispatch_tool({"get_time": get_time}, "get_time", '{"city": "杭州"}') != "杭州 12:00":
        raise SystemExit("dispatch did not return the tool result")
    try:
        dispatch_tool({"get_time": get_time}, "missing", "{}")
    except KeyError:
        pass
    else:
        raise SystemExit("unknown tool should raise KeyError")
    try:
        dispatch_tool({"get_time": get_time}, "get_time", "[]")
    except ValueError:
        pass
    else:
        raise SystemExit("non-object arguments should raise ValueError")
    answer = run_agent("现在几点")
    if answer != "工具返回了 上海 12:00":
        raise SystemExit(f"unexpected agent answer: {answer}")
    print("ok")


if __name__ == "__main__":
    main()
